import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import env from "@/utils/env";

export interface JwtPayload {
  sub: string;
  email: string;
  role?: "user" | "admin";
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET, // put in .env
  });

  // Decorate helpers you can reuse in routes
  fastify.decorate(
    "authRequired",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify<JwtPayload>();
      } catch {
        return reply.code(401).send({ message: "Unauthorized" });
      }
    }
  );

  fastify.decorate(
    "guestOnly",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify<JwtPayload>();
        // If verify succeeded, user is logged in → block
        return reply.code(403).send({ message: "Already authenticated" });
      } catch {
        // No/invalid token → allowed (guest)
      }
    }
  );
};

export default fp(authPlugin);
