import { type FastifyReply, type FastifyRequest } from "fastify";
import type {
  registerRequestBodyType,
  registerReplyBodyType,
  loginRequestBodyType,
  loginReplyBodyType,
  refreshReplyBodyType,
  confirmEmailParamsType,
  confirmEmailGetReplyBodyType,
  confirmEmailPostReplyBodyType,
  confirmEmailPostRequestBodyType,
  passwordResetBodyType,
  passwordResetReplyBodyType,
  passwordResetRequestBodyType,
  passwordResetRequestReplyBodyType,
} from "./auth.schema";
import db from "@/db/database";
import argon2 from "argon2";
import generateRefreshToken, {
  generateRefreshTokenCookie,
} from "@/utils/refreshToken";
import env from "@/utils/env";
import { generateJwtCookieSettings, generateJwtToken } from "@/utils/jwtToken";
import { UserRole } from "@/db/schema";
import { passwordHash, passwordVerify } from "@/utils/password";
import { sendPasswordResetEmail } from "@/utils/email";

/* -------------------------------------------------------------------------- */
/*                                  Register                                  */
/* -------------------------------------------------------------------------- */

// const register = async (
//   req: FastifyRequest<{ Body: registerRequestBodyType }>,
//   reply: FastifyReply<{ Reply: registerReplyBodyType }>
// ): Promise<void> => {
//   const { email, password, name } = req.body;

//   const hash = await passwordHash(password);

//   try {
//     await db
//       .insertInto("users")
//       .values({
//         email,
//         name,
//         password: hash,
//       })
//       .execute();
//   } catch (err: any) {
//     if (err.code === "23505") {
//       // Unique violation
//       reply.status(400).send({ message: "Email already exists" });
//       return;
//     }
//     console.error("Error inserting user:", err);
//     reply.status(500).send({ message: "Internal Server Error" });
//     return;
//   }

//   reply.status(201).send({ message: "User registered successfully" });
//   return;
// };

/* -------------------------------------------------------------------------- */
/*                              Confirm Email GET                             */
/* -------------------------------------------------------------------------- */
export const confirmEmailGet = async (
  req: FastifyRequest<{
    Params: confirmEmailParamsType;
  }>,
  reply: FastifyReply<{
    Reply: confirmEmailGetReplyBodyType;
  }>,
) => {
  const { token } = req.params;

  const found = await db
    .selectFrom("users")
    .where("emailVerificationToken", "=", token)
    .select(["id", "emailVerified"])
    .executeTakeFirst();

  if (!found) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  // Already verified (reusing field for password resets)
  if (found && found.emailVerified) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  return reply.status(200).send({ message: "Token is valid" });
};

/* -------------------------------------------------------------------------- */
/*                             Confirm Email POST                             */
/* -------------------------------------------------------------------------- */
export const confirmEmailPost = async (
  req: FastifyRequest<{
    Body: confirmEmailPostRequestBodyType;
  }>,
  reply: FastifyReply<{
    Reply: confirmEmailPostReplyBodyType;
  }>,
) => {
  const { token, name, password } = req.body;

  const user = await db
    .selectFrom("users")
    .where("emailVerificationToken", "=", token)
    .select(["id", "emailVerified"])
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  // Already verified (reusing field for password resets)
  if (user.emailVerified) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  const hash = await passwordHash(password);

  await db
    .updateTable("users")
    .set({
      name,
      password: hash,
      emailVerificationToken: null,
      emailVerified: true,
      status: "ACTIVE",
    })
    .where("id", "=", user.id)
    .execute();

  return reply.status(200).send({ message: "Email confirmed successfully" });
};
/* -------------------------------------------------------------------------- */
/*                           Password Reset Request                           */
/* -------------------------------------------------------------------------- */
export const requestPasswordReset = async (
  req: FastifyRequest<{ Body: passwordResetRequestBodyType }>,
  reply: FastifyReply<{ Reply: passwordResetRequestReplyBodyType }>,
) => {
  const { email } = req.body;

  const user = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select([
      "id",
      "passwordResetToken",
      "passwordResetTokenExpiresAt",
      "emailVerified",
    ])
    .executeTakeFirst();

  if (!user) {
    return reply.status(200).send({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  if (user && !user.emailVerified) {
    return reply.status(200).send({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  if (user) {
    // Generate a password reset token
    const resetToken = crypto.randomUUID();

    // Set token and expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db
      .updateTable("users")
      .set({
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: expiresAt,
      })
      .where("id", "=", user.id)
      .execute();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);
  }

  // Always respond with success message to prevent email enumeration
  return reply.status(200).send({
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
};
/* -------------------------------------------------------------------------- */
/*                               Password Reset                               */
/* -------------------------------------------------------------------------- */
export const resetPassword = async (
  req: FastifyRequest<{ Body: passwordResetBodyType }>,
  reply: FastifyReply<{ Reply: passwordResetReplyBodyType }>,
) => {
  const { token, password } = req.body;

  const user = await db
    .selectFrom("users")
    .where("passwordResetToken", "=", token)
    .select([
      "id",
      "emailVerified",
      "authz_version",
      "passwordResetTokenExpiresAt",
    ])
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (user && !user.emailVerified) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (user.passwordResetTokenExpiresAt! < new Date()) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  const hash = await passwordHash(password);

  await db
    .updateTable("users")
    .set({
      password: hash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
      authz_version: user.authz_version + 1, // Invalidate existing sessions
    })
    .where("id", "=", user.id)
    .execute();

  await db.deleteFrom("refresh_tokens").where("userId", "=", user.id).execute(); // Invalidate all refresh tokens

  return reply
    .status(200)
    .send({ message: "Password has been reset successfully" });
};

/* -------------------------------------------------------------------------- */
/*                                    Login                                   */
/* -------------------------------------------------------------------------- */

export const login = async (
  req: FastifyRequest<{ Body: loginRequestBodyType }>,
  reply: FastifyReply<{ Reply: loginReplyBodyType }>,
): Promise<void> => {
  const { email, password: passwordAttempt } = req.body;

  const user = await db
    .selectFrom("users")
    .select([
      "id",
      "email",
      "name",
      "password",
      "role",
      "authz_version",
      "status",
    ])
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "Invalid email or password" });
  }

  if (user.status !== "ACTIVE") {
    return reply.status(401).send({ message: "Invalid email or password" });
  }

  const ok = await passwordVerify(passwordAttempt, user.password);

  if (!ok) {
    return reply.status(401).send({ message: "Invalid email or password" });
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
      platform: req.headers["user-agent"] || null,
    })
    .execute();
  // Access Token
  reply.setCookie(
    "refresh_token",
    refresh,
    generateRefreshTokenCookie(expiresAt),
  );
  const jwt = await generateJwtToken(reply, {
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    av: user.authz_version,
  });
  reply.setCookie("access_token", jwt, generateJwtCookieSettings());
  return reply.status(200).send({ accessToken: jwt });
};

/* -------------------------------------------------------------------------- */
/*                                   Logout                                   */
/* -------------------------------------------------------------------------- */
export const logout = async (req: FastifyRequest, reply: FastifyReply) => {
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
export const refresh = async (
  req: FastifyRequest,
  reply: FastifyReply<{
    Reply: refreshReplyBodyType;
  }>,
) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return reply.status(401).send({ message: "No refresh token provided" });
  }

  const tokenRecord = await db
    .selectFrom("refresh_tokens")
    .select(["userId", "expiresAt"])
    .where("token", "=", refreshToken)
    .executeTakeFirst();

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    console.log(tokenRecord);
    console.log(tokenRecord?.expiresAt);
    if (!tokenRecord) {
      console.log("No token record found");
    } else if (tokenRecord.expiresAt < new Date()) {
      console.log("Token expired at:", tokenRecord.expiresAt);
    }
    return reply
      .status(401)
      .send({ message: "Invalid or expired refresh token" });
  }

  const user = await db
    .selectFrom("users")
    .select(["email", "name", "role", "authz_version", "status"])
    .where("id", "=", tokenRecord.userId)
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "User not found" });
  }

  if (user.status !== "ACTIVE") {
    reply.clearCookie("refresh_token", { path: "/" });
    reply.clearCookie("access_token", { path: "/" });

    await db
      .deleteFrom("refresh_tokens")
      .where("token", "=", refreshToken)
      .execute();

    return reply
      .status(403)
      .send({ message: "This user has been deactivated" });
  }

  // Generate new Refresh Token
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + env.REFRESH_TOKEN_TIME_SECONDS);

  // Update the refresh token in the database
  await db
    .updateTable("refresh_tokens")
    .set({ expiresAt: expiresAt })
    .set({ token: newRefreshToken })
    .where("token", "=", refreshToken)
    .execute();

  reply.clearCookie("refresh_token", { path: "/" });
  reply.clearCookie("access_token", { path: "/" });

  reply.setCookie(
    "refresh_token",
    newRefreshToken,
    generateRefreshTokenCookie(expiresAt),
  );

  // Generate new Access Token
  const jwt = await generateJwtToken(reply, {
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    av: user.authz_version,
  });
  reply.setCookie("access_token", jwt, generateJwtCookieSettings());

  return reply
    .code(200)
    .send({ accessToken: jwt, refreshToken: newRefreshToken });
};
