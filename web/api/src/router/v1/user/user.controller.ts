import type { FastifyReply, FastifyRequest } from "fastify";

export const getUserSession = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  return reply.send({ user: request.user });
};
