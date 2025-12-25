import { type FastifyReply, type FastifyRequest } from "fastify";
import type {
  registerRequestBodyType,
  registerReplyBodyType,
  loginRequestBodyType,
  loginReplyBodyType,
} from "./auth.schema";
import db from "@/db/database";
import argon2 from "argon2";
import generateRefreshToken from "@/utils/refreshToken";
import env from "@/utils/env";

/* -------------------------------------------------------------------------- */
/*                                  Register                                  */
/* -------------------------------------------------------------------------- */

type RegisterRoute = {
  Body: registerRequestBodyType;
  Reply: registerReplyBodyType;
};

const register = async (
  req: FastifyRequest<RegisterRoute>,
  reply: FastifyReply<RegisterRoute>
) => {
  const { email, password, name } = req.body;

  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 8 * 1024, // 8 MiB
    timeCost: 2,
    parallelism: 1,
  });

  await db
    .insertInto("users")
    .values({
      email,
      name,
      password: hash,
    })
    .execute()
    .catch((err) => {
      if (err.code === "23505") {
        // Unique violation
        return reply.status(400).send({ message: "Email already exists" });
      }
      console.error("Error inserting user:", err);
      return reply.status(500).send({ message: "Internal Server Error" });
    });

  return reply.status(201).send({ message: "User registered successfully" });
};

/* -------------------------------------------------------------------------- */
/*                                    Login                                   */
/* -------------------------------------------------------------------------- */

type LoginRoute = {
  Body: loginRequestBodyType;
  Reply: loginReplyBodyType;
};

const login = async (
  req: FastifyRequest<LoginRoute>,
  reply: FastifyReply<LoginRoute>
) => {
  const { email, password: passwordAttempt } = req.body;

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ message: "Invalid email or password" });
  }
  const ok = await argon2.verify(user.password, passwordAttempt);

  if (!ok) {
    return reply.status(401).send({ message: "Invalid email or password" });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
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
  reply.setCookie("refresh_token", refresh, {
    httpOnly: true,
    secure: env.NODE_ENV === "production", // true in prod (https)
    sameSite: "lax", // or "strict"
    path: "/api/v1/auth/refresh",
    expires: expiresAt,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  });
  const jwt = await reply.jwtSign(
    {
      email: user.email,
      sub: "1",
    },
    {
      sign: {
        expiresIn: "15m",
        algorithm: "HS256",
      },
    }
  );
  return reply.status(200).send({ accessToken: jwt });
};

/* -------------------------------------------------------------------------- */
/*                                   Logout                                   */
/* -------------------------------------------------------------------------- */
const logout = async (req: FastifyRequest, reply: FastifyReply) => {
  const refreshToken = req.cookies.refresh_token;
  if (refreshToken) {
    await db
      .deleteFrom("refresh_tokens")
      .where("token", "=", refreshToken)
      .execute();
    reply.clearCookie("refresh_token", { path: "/api/v1/auth/refresh" });
  }
  return reply.status(200).send({ message: "Logged out successfully" });
};

/* -------------------------------------------------------------------------- */
/*                                   Refresh                                  */
/* -------------------------------------------------------------------------- */

export { register, login };
