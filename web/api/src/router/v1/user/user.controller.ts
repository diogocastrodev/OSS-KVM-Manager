import type { FastifyReply, FastifyRequest } from "fastify";

export const getUserSession = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  return reply.send({ user: request.user });
};

// REMINDER: When updating user info, also update authz_version to invalidate old tokens
// REMINDER: When logging out from all devices, update authz_version AND delete all refresh tokens
