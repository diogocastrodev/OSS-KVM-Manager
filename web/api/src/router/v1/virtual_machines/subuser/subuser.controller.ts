import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateUserBody,
  CreateUserResponse,
  DeleteSubUserBody,
  DeleteSubUserResponse,
  GetAllSubusersResponse,
  SubUserParams,
  UpdateUserBody,
  UpdateUserResponse,
} from "./subuser.schema";
import db from "@/db/database";
import { sendInviteRegisterEmail } from "@/utils/email";
import { v4 as uuidv4 } from "uuid";
import type {
  ForbiddenErrorType,
  NotFoundErrorType,
} from "@/types/errorSchema";
import { passwordHash } from "@/utils/password";

/* -------------------------------------------------------------------------- */
/*                                 Get SubUsers                               */
/* -------------------------------------------------------------------------- */

export const GetAllSubusers = async (
  req: FastifyRequest<{
    Params: SubUserParams;
  }>,
  reply: FastifyReply<{
    Reply: GetAllSubusersResponse | NotFoundErrorType | ForbiddenErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;
  const vm = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.code(404).send({ message: "Virtual machine not found." });
  }

  const u = await db
    .selectFrom("virtual_machines_users as vmu")
    .innerJoin("users as u", "vmu.userId", "u.id")
    .select(["u.id"])
    .where("vmu.virtualMachinesId", "=", vm.id)
    .where("vmu.role", "=", "OWNER")
    .where("u.email", "=", req.user.email)
    .executeTakeFirst();

  if (!u) {
    return reply.code(403).send({ message: "Forbidden." });
  }

  const a = await db
    .selectFrom("virtual_machines_users as vmsu")
    .innerJoin("virtual_machines as vm", "vmsu.virtualMachinesId", "vm.id")
    .innerJoin("users as u", "vmsu.userId", "u.id")
    .select([
      "vmsu.id as subUserId",
      "u.name as subUserName",
      "u.email as subUserEmail",
      "vmsu.role as subUserRole",
    ])
    .where("vm.publicId", "=", vmPublicId)
    .where("vmsu.role", "!=", "OWNER")
    .orderBy("u.createdAt", "asc")
    .execute();

  if (a.length === 0) {
    return reply.code(404).send({
      message: "No sub-users found for this virtual machine.",
    });
  }

  return reply.code(200).send(a);
};

/* -------------------------------------------------------------------------- */
/*                               Create SubUsers                              */
/* -------------------------------------------------------------------------- */

export const CreateSubuser = async (
  req: FastifyRequest<{
    Body: CreateUserBody;
    Params: SubUserParams;
  }>,
  reply: FastifyReply<{
    Reply: CreateUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.code(404).send({ message: "Virtual machine not found." });
  }

  const u = await db
    .selectFrom("virtual_machines_users as vmu")
    .innerJoin("users as u", "vmu.userId", "u.id")
    .select(["u.id", "u.name"])
    .where("vmu.virtualMachinesId", "=", vm.id)
    .where("vmu.role", "=", "OWNER")
    .where("u.email", "=", req.user.email)
    .executeTakeFirst();

  if (req.user.role !== "ADMIN") {
    if (!u) {
      return reply.code(403).send({ message: "Forbidden." });
    }
  }

  const userExists = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("email", "=", req.body.email)
    .executeTakeFirst();

  if (!userExists) {
    const emailVerificationToken = uuidv4();

    const b = await db
      .insertInto("users")
      .values({
        email: req.body.email.toLowerCase(),
        name: "TBD",
        password: await passwordHash(uuidv4()),
        emailVerificationToken,
      })
      .returning(["id", "emailVerificationToken"])
      .executeTakeFirst();

    if (u) {
      sendInviteRegisterEmail(
        u?.name || "Admin",
        req.body.email.toLowerCase(),
        b!.emailVerificationToken!,
      );
    } else {
      sendInviteRegisterEmail(
        "Admin",
        req.body.email.toLowerCase(),
        b!.emailVerificationToken!,
      );
    }

    await db
      .insertInto("virtual_machines_users")
      .values({
        userId: b!.id,
        virtualMachinesId: vm.id,
        role: req.body.role,
      })
      .execute();
  } else {
    await db
      .insertInto("virtual_machines_users")
      .values({
        userId: userExists.id,
        virtualMachinesId: vm.id,
        role: req.body.role,
      })
      .execute();
  }

  return reply.code(201).send({ message: "Sub-user added successfully." });
};

/* -------------------------------------------------------------------------- */
/*                               Update SubUser                               */
/* -------------------------------------------------------------------------- */
export const UpdateSubUser = async (
  req: FastifyRequest<{
    Body: UpdateUserBody;
    Params: SubUserParams;
  }>,
  reply: FastifyReply<{
    Reply: UpdateUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.code(404).send({ message: "Virtual machine not found." });
  }

  if (req.user.role !== "ADMIN") {
    const u = await db
      .selectFrom("virtual_machines_users as vmu")
      .innerJoin("users as u", "vmu.userId", "u.id")
      .select(["u.id"])
      .where("vmu.virtualMachinesId", "=", vm.id)
      .where("vmu.role", "=", "OWNER")
      .where("u.email", "=", req.user.email)
      .executeTakeFirst();

    if (!u) {
      return reply.code(403).send({ message: "Forbidden." });
    }
  }

  const subUser = await db
    .updateTable("virtual_machines_users")
    .set({ role: req.body.role })
    .where("id", "=", req.body.subUserId)
    .executeTakeFirst();

  if (!subUser) {
    return reply.code(404).send({ message: "Sub-user not found." });
  }

  return reply.code(200).send({ message: "Sub-user updated successfully." });
};

/* -------------------------------------------------------------------------- */
/*                               Delete SubUser                               */
/* -------------------------------------------------------------------------- */

export const DeleteSubUser = async (
  req: FastifyRequest<{
    Body: DeleteSubUserBody;
    Params: SubUserParams;
  }>,
  reply: FastifyReply<{
    Reply: DeleteSubUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;
  const vm = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.code(404).send({ message: "Virtual machine not found." });
  }

  const u = await db
    .selectFrom("virtual_machines_users as vmu")
    .innerJoin("users as u", "vmu.userId", "u.id")
    .select(["u.id"])
    .where("vmu.virtualMachinesId", "=", vm.id)
    .where("vmu.role", "=", "OWNER")
    .where("u.email", "=", req.user.email)
    .executeTakeFirst();

  if (!u) {
    return reply.code(403).send({ message: "Forbidden." });
  }

  const subUser = await db
    .deleteFrom("virtual_machines_users")
    .where("id", "=", req.body.subUserId)
    .executeTakeFirst();

  if (!subUser) {
    return reply.code(404).send({ message: "Sub-user not found." });
  }

  return reply.code(200).send({ message: "Sub-user removed successfully." });
};
