import { type FastifyReply, type FastifyRequest } from "fastify";
import type {
  registerRequestBodyType,
  registerReplyBodyType,
  loginRequestBodyType,
  loginReplyBodyType,
  refreshReplyBodyType,
} from "./auth.schema";
import db from "@/db/database";
import argon2 from "argon2";
import generateRefreshToken, {
  generateRefreshTokenCookie,
} from "@/utils/refreshToken";
import env from "@/utils/env";
import { generateJwtCookieSettings, generateJwtToken } from "@/utils/jwtToken";
import { UserRole } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*                                  Register                                  */
/* -------------------------------------------------------------------------- */

const register = async (
  req: FastifyRequest<{ Body: registerRequestBodyType }>,
  reply: FastifyReply<{ Reply: registerReplyBodyType }>
): Promise<void> => {
  const { email, password, name } = req.body as registerRequestBodyType;

  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 8 * 1024, // 8 MiB
    timeCost: 2,
    parallelism: 1,
  });

  try {
    await db
      .insertInto("users")
      .values({
        email,
        name,
        password: hash,
      })
      .execute();
  } catch (err: any) {
    if (err.code === "23505") {
      // Unique violation
      reply.status(400).send({ message: "Email already exists" });
      return;
    }
    console.error("Error inserting user:", err);
    reply.status(500).send({ message: "Internal Server Error" });
    return;
  }

  reply.status(201).send({ message: "User registered successfully" });
  return;
};

/* -------------------------------------------------------------------------- */
/*                                    Login                                   */
/* -------------------------------------------------------------------------- */

const login = async (
  req: FastifyRequest<{ Body: loginRequestBodyType }>,
  reply: FastifyReply<{ Reply: loginReplyBodyType }>
): Promise<void> => {
  const { email, password: passwordAttempt } = req.body as loginRequestBodyType;

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user) {
    reply.status(401).send({ message: "Invalid email or password" });
    return;
  }
  const ok = await argon2.verify(user.password, passwordAttempt);

  if (!ok) {
    reply.status(401).send({ message: "Invalid email or password" });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + env.REFRESH_TOKEN_TIME_SECONDS);

  const refresh = generateRefreshToken();
  await db
    .insertInto("refresh_tokens")
    .values({
      token: refresh,
      userId: user.id,
      expiresAt: expiresAt,
    })
    .execute();
  // Access Token
  reply.setCookie(
    "refresh_token",
    refresh,
    generateRefreshTokenCookie(expiresAt)
  );
  const jwt = await generateJwtToken(reply, {
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });
  reply.setCookie("access_token", jwt, generateJwtCookieSettings());
  return reply.status(200).send({ accessToken: jwt });
};

/* -------------------------------------------------------------------------- */
/*                                   Logout                                   */
/* -------------------------------------------------------------------------- */
const logout = async (req: FastifyRequest, reply: FastifyReply) => {
  const refreshToken = req.cookies.refresh_token;
  // clear the old path variants
  reply.clearCookie("refresh_token", { path: "/api/v1/auth/refresh" });
  reply.clearCookie("refresh_token", { path: "/api/v1/auth" });
  reply.clearCookie("refresh_token", { path: "/api/v1" });
  reply.clearCookie("refresh_token", { path: "/api" });

  // clear the current one
  reply.clearCookie("refresh_token", { path: "/" });

  // also clear access
  reply.clearCookie("access_token", { path: "/" });

  // csrf too if you want
  reply.clearCookie("_csrf", { path: "/api/v1" });
  reply.clearCookie("_csrf", { path: "/" });

  if (refreshToken) {
    await db
      .deleteFrom("refresh_tokens")
      .where("token", "=", refreshToken)
      .execute();
    reply.clearCookie("refresh_token");
    reply.clearCookie("access_token");
  }
  return reply.status(200).send({ message: "Logged out successfully" });
};

/* -------------------------------------------------------------------------- */
/*                                   Refresh                                  */
/* -------------------------------------------------------------------------- */
const refresh = async (
  req: FastifyRequest,
  reply: FastifyReply<{
    Reply: refreshReplyBodyType;
  }>
) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return reply.status(401).send({ message: "No refresh token provided" });
  }

  const tokenRecord = await db
    .selectFrom("refresh_tokens")
    .selectAll()
    .where("token", "=", refreshToken)
    .executeTakeFirst();

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return reply
      .status(401)
      .send({ message: "Invalid or expired refresh token" });
  }

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", tokenRecord.userId)
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "User not found" });
  }

  // Generate new Refresh Token
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + env.REFRESH_TOKEN_TIME_SECONDS);

  await db
    .insertInto("refresh_tokens")
    .values({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: expiresAt,
    })
    .execute();

  // Delete old refresh token
  await db
    .deleteFrom("refresh_tokens")
    .where("token", "=", refreshToken)
    .execute();

  reply.clearCookie("refresh_token", { path: "/" });
  reply.clearCookie("access_token", { path: "/" });

  reply.setCookie(
    "refresh_token",
    newRefreshToken,
    generateRefreshTokenCookie(expiresAt)
  );

  // Generate new Access Token
  const jwt = await generateJwtToken(reply, {
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });
  reply.setCookie("access_token", jwt, generateJwtCookieSettings());

  return reply
    .code(200)
    .send({ accessToken: jwt, refreshToken: newRefreshToken });
};

export { register, login, logout, refresh };
