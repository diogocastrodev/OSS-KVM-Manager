import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import env from "@/utils/env";
import { getPrivatePem, getPublicPem } from "./jose";
import type { UserRole } from "@/db/schema";

export interface JwtPayload {
  email: string;
  name?: string | null;
  role: UserRole;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: {
      private: getPrivatePem(),
      public: getPublicPem(),
    },
    cookie: {
      cookieName: "access_token",
      signed: false,
    },
    sign: { algorithm: "RS256" },
    verify: { algorithms: ["RS256"] },
  });

  fastify.decorate(
    "authRequired",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        // If Authorization header exists, jwtVerify uses it.
        // Otherwise it falls back to the configured cookie.
        await req.jwtVerify();
        (req as any).authMode = req.headers.authorization?.startsWith("Bearer ")
          ? "bearer"
          : "cookie";
      } catch (err) {
        req.log.error({ err }, "authRequired verify failed");
        return reply.code(401).send({ message: "Invalid token" });
      }
    }
  );

  fastify.decorate(
    "guestOnly",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify(); // will verify bearer if present or cookie if present
        return reply.code(403).send({ message: "Already authenticated" });
      } catch {
        // no/invalid token => guest
      }
    }
  );
};
export default fp(authPlugin);
