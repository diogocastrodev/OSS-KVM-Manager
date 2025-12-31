import type { FastifyPluginAsync } from "fastify";
import { getUserSession } from "./user.controller";

const usersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/session",
    {
      preValidation: [fastify.authRequired],
    },
    getUserSession
  );
};

export default usersRoute;
