import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  GetUsersByPageQueryType,
  GetUsersByPageReplyBodyType,
  RegisterUserAdminReplyBodyType,
  RegisterUserAdminRequestBodyType,
  UpdateUserAdminReplyBodyType,
  UpdateUserAdminRequestBodyType,
  UpdateUserAdminRequestParamsType,
} from "./user.schema";
import db from "@/db/database";
import { passwordHash } from "@/utils/password";
import { v4 as uuidv4 } from "uuid";
import { sendRegisterEmail } from "@/utils/email";
import type {
  BadRequestErrorType,
  NotFoundErrorType,
  UnauthorizedErrorType,
} from "@/types/errorSchema";
import type { UserDeactivationReason, UserRole, UserStatus } from "@/db/schema";

export const registerUserAdmin = async (
  req: FastifyRequest<{
    Body: RegisterUserAdminRequestBodyType;
  }>,
  reply: FastifyReply<{
    Reply: RegisterUserAdminReplyBodyType;
  }>,
) => {
  const { email } = req.body;

  const hash = await passwordHash(uuidv4());

  const checkEmail = await db
    .selectFrom("users")
    .where("email", "=", email.toLowerCase())
    .select(["id"])
    .executeTakeFirst();

  if (checkEmail) {
    return reply.status(400).send({
      message: "Email already in use",
    });
  }

  const emailVerificationToken = uuidv4();

  const newUser = await db
    .insertInto("users")
    .values({
      name: "TBD",
      email: email.toLowerCase(),
      password: hash,
      emailVerificationToken: emailVerificationToken,
    })
    // .returning(["id", "email", "emailVerificationToken"])
    .executeTakeFirstOrThrow();

  if (!newUser) {
    return reply.status(500).send({
      message: "Failed to create user",
    });
  }

  try {
    await sendRegisterEmail(email.toLowerCase(), emailVerificationToken);
  } catch (error) {
    console.error("Error sending registration email:", error);
    await db
      .deleteFrom("users")
      .where("email", "=", email.toLowerCase())
      .execute();
    return reply.status(500).send({
      message: "Failed to send registration email",
    });
  }
  return reply.status(200).send({
    message: "User registered successfully",
  });
};

export const getUsersByPage = async (
  req: FastifyRequest<{
    Querystring: GetUsersByPageQueryType;
  }>,
  reply: FastifyReply<{
    Reply:
      | GetUsersByPageReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType
      | BadRequestErrorType;
  }>,
) => {
  const { page, limit, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return reply.status(400).send({
      message: "Invalid page or limit",
    });
  }
  req.log.info(
    `Fetching users - Page: ${pageNum}, Limit: ${limitNum}, Search: ${search}`,
  );

  const offset = (pageNum - 1) * limitNum;

  const searchTerm = search?.trim();

  const pattern = `%${searchTerm}%`;

  const usersQuery = db
    .selectFrom("users")
    .select([
      "id",
      "name",
      "email",
      "status",
      "role",
      "status",
      "deactivationReason",
      "createdAt",
      "updatedAt",
    ])
    .$if(!!searchTerm, (qb) =>
      qb.where((eb) =>
        eb.or([eb("name", "ilike", pattern), eb("email", "ilike", pattern)]),
      ),
    )
    .orderBy("createdAt", "desc")
    .limit(limitNum)
    .offset(offset);

  const users = await usersQuery.execute();

  const totalUsersQuery = db
    .selectFrom("users")
    .select(db.fn.count("id").as("count"))
    .$if(!!searchTerm, (qb) =>
      qb.where((eb) =>
        eb.or([eb("name", "ilike", pattern), eb("email", "ilike", pattern)]),
      ),
    );

  const totalUsers = await totalUsersQuery.executeTakeFirstOrThrow();

  return reply.status(200).send({
    users,
    total: Number(totalUsers.count),
  });
};

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
export const updateUserAdmin = async (
  req: FastifyRequest<{
    Params: UpdateUserAdminRequestParamsType;
    Body: UpdateUserAdminRequestBodyType;
  }>,
  reply: FastifyReply<{
    Reply:
      | UpdateUserAdminReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType
      | BadRequestErrorType;
  }>,
) => {
  const { id } = req.params;
  const { name, email, role, status, deactivationReason } = req.body;

  const user = await db
    .selectFrom("users")
    .where("id", "=", id)
    .select(["id", "email", "deactivationReason", "authz_version"])
    .executeTakeFirst();

  if (!user) {
    return reply.status(404).send({
      message: "User not found",
    });
  }

  if (user.email === req.user.email) {
    return reply.status(400).send({
      message: "You cannot change your data...",
    });
  }

  const emailInUse = await db
    .selectFrom("users")
    .where("email", "=", email.toLowerCase())
    .where("id", "!=", id)
    .select(["id"])
    .executeTakeFirst();

  if (emailInUse) {
    return reply.status(400).send({
      message: "Email already in use",
    });
  }

  await db
    .updateTable("users")
    .set({
      name,
      email: email.toLowerCase(),
      role: role.toUpperCase() as UserRole,
      status: status.toUpperCase() as UserStatus,
      // status.toLowerCase() === "active"
      //   ? "ACTIVE"
      //   : status.toLowerCase() === "deactivated"
      //     ? "DEACTIVATED"
      //     : "PENDING",
      deactivationReason:
        (deactivationReason?.toUpperCase() as UserDeactivationReason) || null,
      // deactivationReason === "other"
      //   ? "OTHER"
      //   : deactivationReason === "terms_of_service_violation"
      //     ? "TERMS_OF_SERVICE_VIOLATION"
      //     : deactivationReason === "user"
      //       ? "USER_REQUEST"
      //       : null,
      updatedAt: new Date(),
      authz_version: user.authz_version + 1,
    })
    .where("id", "=", id)
    .execute();

  return reply.status(200).send({
    message: "User updated successfully",
  });
};

export const forceEmailVerification = async (
  req: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;

  const user = await db
    .selectFrom("users")
    .where("id", "=", id)
    .select(["email"])
    .executeTakeFirst();

  if (!user) {
    return reply.status(404).send({
      message: "User not found",
    });
  }

  const verifyEmail = await db
    .updateTable("users")
    .set({
      emailVerificationToken: null,
      emailVerified: true,
      status: "ACTIVE",
      updatedAt: new Date(),
    })
    .where("id", "=", id)
    .execute();

  if (!verifyEmail) {
    return reply.status(500).send({
      message: "Failed to verify email",
    });
  }

  return reply.status(200).send({
    message: "Email verified successfully",
  });
};
