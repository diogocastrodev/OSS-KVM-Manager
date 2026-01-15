import swaggerTags from "@/types/swaggerTags";
import type { FastifyPluginAsync } from "fastify";
import {
  createServerReplyBody,
  createServerRequestBody,
  getOneServerParamsSchema,
  getOneServerReplyBody,
  getServersReplyBody,
  tryInfoReplyBody,
  tryInfoRequestBody,
  type createServerReplyBodyType,
  type createServerRequestBodyType,
  type getOneServerParamsSchemaType,
  type getOneServerReplyBodyType,
  type getServersReplyBodyType,
  type tryInfoReplyBodyType,
  type tryInfoRequestBodyType,
  type getServersRequestQueryStringType,
  getServersRequestQueryString,
} from "./servers.schema";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import {
  createServer,
  getAllServers,
  getOneServer,
  tryInfo,
} from "./servers.controller";

const serversAdminRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               Get All Servers                              */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Querystring: getServersRequestQueryStringType;
    Reply: getServersReplyBodyType | UnauthorizedErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Get list of servers",
        description:
          "Returns a list of servers accessible to the authenticated user",
        querystring: getServersRequestQueryString,
        response: {
          200: getServersReplyBody,
          401: UnauthorizedError,
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
    "/:publicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Get details of a specific server",
        description:
          "Returns details of a server identified by publicId if accessible to the authenticated user",
        params: getOneServerParamsSchema,
        response: {
          200: getOneServerReplyBody,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getOneServer
  );

  /* -------------------------------------------------------------------------- */
  /*                                  Try Info                                  */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Body: tryInfoRequestBodyType;
    Reply: tryInfoReplyBodyType | NotFoundErrorType;
  }>(
    "/try-info",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Try to get Information from Server",
        description:
          "Try to retrieve information about the server specifications.",
        body: tryInfoRequestBody,
        response: {
          200: tryInfoReplyBody,
          404: NotFoundError,
        },
      },
    },
    tryInfo
  );
  /* -------------------------------------------------------------------------- */
  /*                                Create Server                               */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Body: createServerRequestBodyType;
    Reply: createServerReplyBodyType | UnauthorizedErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Create a new server",
        description: "Create a new server entry in the system.",
        body: createServerRequestBody,
        response: {
          200: createServerReplyBody,
          401: UnauthorizedError,
        },
      },
    },
    createServer
  );
};

export default serversAdminRoute;
