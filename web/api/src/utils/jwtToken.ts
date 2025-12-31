import type { JwtPayload } from "@/plugins/auth";
import type { FastifyReply } from "fastify";
import env from "./env";
import type { CookieSerializeOptions } from "@fastify/cookie";
import { getKid } from "@/plugins/jose";

const generateJwtToken = async (
  reply: FastifyReply,
  payload: JwtPayload
): Promise<string> => {
  return await reply.jwtSign(payload, {
    sign: {
      expiresIn: env.JWT_TOKEN_TIME_SECONDS,
      algorithm: "RS256",
      kid: getKid(),
    },
  });
};

const generateJwtCookieSettings = (): CookieSerializeOptions => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production", // true in prod (https)
    sameSite: "lax", // or "strict"
    expires: new Date(Date.now() + env.JWT_TOKEN_TIME_SECONDS * 1000),
    maxAge: env.JWT_TOKEN_TIME_SECONDS,
    path: "/",
  };
};

export { generateJwtToken, generateJwtCookieSettings };
