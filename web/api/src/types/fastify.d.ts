import "fastify";
import type { JwtPayload } from "@/plugins/auth"; // or re-declare payload type here

declare module "fastify" {
  interface FastifyInstance {
    authRequired: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    guestOnly: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    adminOnly: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
