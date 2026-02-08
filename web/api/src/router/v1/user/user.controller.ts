import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  DeleteAllUserAuthResponse,
  DeleteUserAuthRequestParams,
  DeleteUserAuthResponse,
  UpdateUserPasswordRequest,
  UpdateUserPasswordResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfileResponse,
} from "./user.schema";
import db from "@/db/database";
import type {
  NotFoundErrorType,
  UnauthorizedErrorType,
} from "@/types/errorSchema";
import { passwordHash, passwordVerify } from "@/utils/password";

export const getUserSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.send({ user: request.user });
};

export const getUserProfile = async (
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: UserProfileResponse | NotFoundErrorType;
  }>,
) => {
  const user = request.user;

  const u = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("email", "=", user.email)
    .executeTakeFirst();

  if (!u) {
    return reply.status(404).send({ message: "User not found" });
  }

  const logins = await db
    .selectFrom("refresh_tokens")
    .select(["platform as platformName", "createdAt", "updatedAt", "id"])
    .where("userId", "=", u.id)
    .orderBy("updatedAt", "desc")
    .execute();

  return reply.send({
    name: u.name,
    email: u.email,
    logins: logins.map((login) => ({
      id: login.id,
      platformName: login.platformName || "Unknown Device",
      createdAt: login.createdAt.toISOString(),
      lastUsed: login.updatedAt.toISOString(),
    })),
  });
};

export const updateUserProfile = async (
  req: FastifyRequest<{
    Body: UpdateUserProfileRequest;
  }>,
  reply: FastifyReply<{
    Reply:
      | UpdateUserProfileResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>,
) => {
  const u = await db
    .selectFrom("users")
    .select(["id", "authz_version"])
    .where("email", "=", req.user.email)
    .executeTakeFirst();

  if (!u) {
    return reply.status(404).send({ message: "User not found" });
  }

  const existingEmailUser = await db
    .selectFrom("users")
    .select("id")
    .where("email", "=", req.body.email)
    .where("id", "!=", u.id)
    .executeTakeFirst();

  if (existingEmailUser) {
    return reply.status(400).send({ message: "Email is already in use" });
  }

  await db
    .updateTable("users")
    .set({
      name: req.body.name,
      email: req.body.email,
      authz_version: u.authz_version + 1, // Invalidate old tokens
      updatedAt: new Date(),
    })
    .where("id", "=", u.id)
    .execute();

  return reply.status(200).send({ message: "Profile updated successfully" });
};

export const updateUserPassword = async (
  req: FastifyRequest<{
    Body: UpdateUserPasswordRequest;
  }>,
  reply: FastifyReply<{
    Reply:
      | UpdateUserPasswordResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>,
) => {
  const u = await db
    .selectFrom("users")
    .select(["id", "password", "authz_version"])
    .where("email", "=", req.user.email)
    .executeTakeFirst();

  if (!u) {
    return reply.status(404).send({ message: "User not found" });
  }

  // Verify current password
  const isCurrentPasswordValid = await passwordVerify(
    req.body.currentPassword,
    u.password,
  );

  if (!isCurrentPasswordValid) {
    return reply.status(401).send({ message: "Current password is incorrect" });
  }

  const hashNewPassword = await passwordHash(req.body.newPassword);

  await db
    .updateTable("users")
    .set({
      password: hashNewPassword,
      authz_version: u.authz_version + 1, // Invalidate old tokens
      updatedAt: new Date(),
    })
    .where("id", "=", u.id)
    .execute();

  return reply.status(200).send({ message: "Password updated successfully" });
};

export const deleteUserSession = async (
  req: FastifyRequest<{
    Params: DeleteUserAuthRequestParams;
  }>,
  reply: FastifyReply<{
    Reply: DeleteUserAuthResponse | NotFoundErrorType | UnauthorizedErrorType;
  }>,
) => {
  const token = req.cookies["refresh_token"];

  if (!token) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const session = await db
    .selectFrom("refresh_tokens")
    .innerJoin("users", "users.id", "refresh_tokens.userId")
    .select([
      "refresh_tokens.id",
      "refresh_tokens.token",
      "email as userEmail",
      "userId",
      "authz_version",
    ])
    .where("refresh_tokens.id", "=", req.params.id)
    .executeTakeFirst();

  if (!session) {
    return reply.status(404).send({ message: "Session not found" });
  }

  if (session.token === token) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  if (session.userEmail !== req.user.email) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  await db
    .deleteFrom("refresh_tokens")
    .where("refresh_tokens.id", "=", req.params.id)
    .execute();

  await db
    .updateTable("users")
    .set({
      authz_version: session.authz_version + 1, // Invalidate old tokens
      updatedAt: new Date(),
    })
    .where("users.id", "=", session.userId)
    .execute();

  return reply.status(200).send({ message: "Session deleted successfully" });
};

export const deleteAllUserSessions = async (
  req: FastifyRequest,
  reply: FastifyReply<{
    Reply:
      | DeleteAllUserAuthResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>,
) => {
  const token = req.cookies["refresh_token"];

  if (!token) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const user = await db
    .selectFrom("users")
    .select(["id", "authz_version"])
    .where("email", "=", req.user.email)
    .executeTakeFirst();

  if (!user) {
    return reply.status(404).send({ message: "User not found" });
  }

  await db
    .deleteFrom("refresh_tokens")
    .where("userId", "=", user.id)
    .where("token", "!=", token)
    .execute();

  await db
    .updateTable("users")
    .set({
      authz_version: user.authz_version + 1, // Invalidate old tokens
      updatedAt: new Date(),
    })
    .where("id", "=", user.id)
    .execute();

  return reply
    .status(200)
    .send({ message: "All sessions deleted successfully" });
};
