import type { FastifyPluginAsync } from "fastify";
import { getMyServers } from "./servers.controller";
import {
  getMyServersParamsSchema,
  getMyServersReplyBody,
  type getMyServersParamsSchemaType,
  type getMyServersReplyBodyType,
} from "./servers.schema";
import { UnauthorizedError } from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const serversRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               Get My Servers                               */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Querystring: getMyServersParamsSchemaType;
    Reply: getMyServersReplyBodyType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.SERVERS],
        summary: "Get list of my servers",
        description:
          "Returns a list of servers owned by the authenticated user",
        querystring: getMyServersParamsSchema,
        response: {
          200: getMyServersReplyBody,
          401: UnauthorizedError,
        },
      },
    },
    getMyServers
  );
};

export default serversRoute;
