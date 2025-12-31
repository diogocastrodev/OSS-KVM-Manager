import crypto from "crypto";
import env from "./env";
import type { CookieSerializeOptions } from "@fastify/cookie";

const generateRefreshToken = (): string => {
  const h1 = crypto.randomBytes(32).toString("base64url");
  const h2 = crypto.createHash("sha256").update(h1).digest("hex");
  return h2;
};

const generateRefreshTokenCookie = (
  expiresAt: Date
): CookieSerializeOptions => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production", // true in prod (https)
    sameSite: "lax", // or "strict"
    path: "/", // /api/v1/auth/refresh
    expires: expiresAt,
    maxAge: env.REFRESH_TOKEN_TIME_SECONDS, // in seconds
  };
};

export default generateRefreshToken;

export { generateRefreshTokenCookie };
