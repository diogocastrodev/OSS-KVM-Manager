import type { FastifyPluginAsync } from "fastify";
import { getUserSession } from "./user.controller";
import swaggerTags from "@/types/swaggerTags";

const usersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/session",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
      },
    },
    getUserSession
  );
};

export default usersRoute;
