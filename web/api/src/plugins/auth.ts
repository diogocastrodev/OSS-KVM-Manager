import fp from "fastify-plugin";
import fastifyJwt, { type Secret } from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import env from "@/utils/env";
import { getPrivatePemString, getPublicPemString } from "./jose";
import { UserRole } from "@/db/schema";
import db from "@/db/database";
import crypto from "crypto";

export interface JwtPayload {
  email: string;
  name: string;
  role: UserRole;
  av: number;
}

const s: Secret | { private: Secret; public: Secret } =
  env.JWT_MODE === "secret"
    ? env.JWT_SECRET
    : {
        private: getPrivatePemString(),
        public: getPublicPemString(),
      };

export enum Algorithms {
  HS256 = "HS256", // Secret - HMAC using SHA-256
  RS256 = "RS256", // Asymmetric - RSASSA-PKCS1-v1_5 using SHA-256
}

export const alg: Algorithms =
  env.JWT_MODE === "secret" ? Algorithms.HS256 : Algorithms.RS256;

async function fetchPublicKeyPem(serverId: string): Promise<string | null> {
  const row = await db
    .selectFrom("servers")
    .select(["public_key"])
    .where("id", "=", serverId)
    .executeTakeFirst();

  if (row && row.public_key) {
    return row.public_key;
  }

  return null;
}

type CacheEntry = { key: crypto.KeyObject; expiresAt: number };
const keyCache = new Map<string, CacheEntry>();
const KEY_TTL_MS = 60_000; // 1 minute

async function getKeyObject(agentId: string): Promise<crypto.KeyObject | null> {
  const now = Date.now();
  const cached = keyCache.get(agentId);
  if (cached && cached.expiresAt > now) return cached.key;

  const pem = await fetchPublicKeyPem(agentId);
  if (!pem) return null;

  const key = crypto.createPublicKey(pem);
  keyCache.set(agentId, { key, expiresAt: now + KEY_TTL_MS });
  return key;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: s,
    cookie: {
      cookieName: "access_token",
      signed: false,
    },
    sign: { algorithm: alg },
    verify: { algorithms: [alg] },
  });

  const maxSkewSeconds = 60;
  const nonceTtlMs = 5 * 60_000;
  const nonceMap = new Map<string, number>();

  function cleanupNonces() {
    const now = Date.now();
    for (const [k, exp] of nonceMap) if (exp <= now) nonceMap.delete(k);
  }

  // fastify.decorate(
  //   "authRequired",
  //   async (req: FastifyRequest, reply: FastifyReply) => {
  //     try {
  //       // If Authorization header exists, jwtVerify uses it.
  //       // Otherwise it falls back to the configured cookie.
  //       await req.jwtVerify();
  //       (req as any).authMode = req.headers.authorization?.startsWith("Bearer ")
  //         ? "bearer"
  //         : "cookie";
  //     } catch (err) {
  //       req.log.error({ err }, "authRequired verify failed");
  //       return reply.code(401).send({ message: "Invalid token" });
  //     }
  //   }
  // );
  fastify.decorate(
    "authRequired",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();

        (req as any).authMode = req.headers.authorization?.startsWith("Bearer ")
          ? "bearer"
          : "cookie";

        const email = req.user?.email;
        const tokenAv = Number((req as any).user?.av ?? 0);

        if (!email)
          return reply
            .code(401)
            .send({ message: "Invalid token", code: "INVALID_TOKEN" });

        const row = await db
          .selectFrom("users")
          .select(["authz_version"])
          .where("email", "=", email)
          .executeTakeFirst();

        if (!row) {
          return reply
            .code(401)
            .send({ message: "Invalid token", code: "INVALID_TOKEN" });
        }

        const currentAv = row?.authz_version ?? 0;

        if (tokenAv < currentAv) {
          return reply
            .code(401)
            .send({ message: "Token stale", code: "TOKEN_STALE" });
        }
      } catch (err) {
        req.log.error({ err }, "authRequired verify failed");
        return reply
          .code(401)
          .send({ message: "Invalid token", code: "INVALID_TOKEN" });
      }
    }
  );

  fastify.decorate(
    "guestOnly",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify(); // will verify bearer if present or cookie if present
        return reply.code(403).send({
          message: "Already authenticated",
          code: "ALREADY_AUTHENTICATED",
        });
      } catch {
        // no/invalid token => guest
      }
    }
  );

  fastify.decorate(
    "adminOnly",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const payload = req.user as JwtPayload;
        if (payload.role !== UserRole.ADMIN) {
          return reply.code(403).send({
            message: "Admin access required",
            code: "ADMIN_ACCESS_REQUIRED",
          });
        }
      } catch (err) {
        req.log.error({ err }, "adminOnly verify failed");
        return reply
          .code(401)
          .send({ message: "Invalid token", code: "INVALID_TOKEN" });
      }
    }
  );

  fastify.decorate(
    "agentCheck",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const agentId = req.headers["x-agent-id"];
      const ts = req.headers["x-timestamp"];
      const nonce = req.headers["x-nonce"];
      const sigB64 = req.headers["x-signature"];

      if (
        typeof agentId !== "string" ||
        typeof ts !== "string" ||
        typeof nonce !== "string" ||
        typeof sigB64 !== "string"
      )
        return reply.code(401).send({ error: "missing auth headers" });

      const pubKey = await getKeyObject(agentId);
      if (!pubKey) return reply.code(401).send({ error: "unknown agent" });

      const tsNum = Number(ts);
      if (!Number.isFinite(tsNum))
        return reply.code(401).send({ error: "bad timestamp" });

      const nowSec = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSec - tsNum) > maxSkewSeconds) {
        return reply.code(401).send({ error: "timestamp out of range" });
      }

      cleanupNonces();
      const nonceKey = `${agentId}:${nonce}`;
      if (nonceMap.has(nonceKey))
        return reply.code(401).send({ error: "replay detected" });
      nonceMap.set(nonceKey, Date.now() + nonceTtlMs);

      const pathWithQuery = req.raw.url ?? req.url;
      const range =
        typeof req.headers["range"] === "string" ? req.headers["range"] : "";
      const canonical = `${req.method}\n${pathWithQuery}\n${ts}\n${nonce}\n${range}\n`;

      const ok = crypto.verify(
        null,
        Buffer.from(canonical, "utf8"),
        pubKey,
        Buffer.from(sigB64, "base64")
      );

      if (!ok) return reply.code(401).send({ error: "bad signature" });
    }
  );
};
export default fp(authPlugin);
