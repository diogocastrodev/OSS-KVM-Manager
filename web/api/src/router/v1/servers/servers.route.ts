import type { FastifyPluginAsync } from "fastify";
import { getAllServers, getOneServer, tryInfo } from "./servers.controller";
import {
  getOneServerParamsSchema,
  getOneServerReplyBody,
  getServersReplyBody,
  tryInfoReplyBody,
  tryInfoRequestBody,
  type getOneServerParamsSchemaType,
  type getOneServerReplyBodyType,
  type tryInfoReplyBodyType,
  type tryInfoRequestBodyType,
} from "./servers.schema";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
} from "@/types/errorSchema";

const serversRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               Get All Servers                              */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: ["Servers"],
        summary: "Get list of servers",
        description:
          "Returns a list of servers accessible to the authenticated user",
        response: {
          401: UnauthorizedError,
          200: getServersReplyBody,
        },
      },
    },
    getAllServers
  );
  /* -------------------------------------------------------------------------- */
  /*                               Get One Server                               */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Params: getOneServerParamsSchemaType;
    Reply: getOneServerReplyBodyType | NotFoundErrorType;
  }>(
    "/:serverId",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: ["Servers"],
        summary: "Get details of a specific server",
        description:
          "Returns details of a server identified by serverId if accessible to the authenticated user",
        params: getOneServerParamsSchema,
        response: {
          404: NotFoundError,
          401: UnauthorizedError,
          200: getOneServerReplyBody,
        },
      },
    },
    getOneServer
  );
  fastify.post<{
    Body: tryInfoRequestBodyType;
    Reply: tryInfoReplyBodyType | NotFoundErrorType;
  }>(
    "/try-info",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: ["Servers"],
        summary: "Try to get Information from Server",
        description:
          "Try to retrieve information about the server specifications.",
        body: tryInfoRequestBody,
        response: {
          404: NotFoundError,
          200: tryInfoReplyBody,
        },
      },
    },
    tryInfo
  );
};

export default serversRoute;
