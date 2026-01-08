import type { FastifyPluginAsync } from "fastify";
import {
  createServer,
  getAllServers,
  getMyServers,
  getOneServer,
  tryInfo,
} from "./servers.controller";
import {
  createServerReplyBody,
  createServerRequestBody,
  getMyServersParamsSchema,
  getMyServersReplyBody,
  getOneServerParamsSchema,
  getOneServerReplyBody,
  getServersReplyBody,
  tryInfoReplyBody,
  tryInfoRequestBody,
  type createServerReplyBodyType,
  type createServerRequestBodyType,
  type getMyServersParamsSchemaType,
  type getMyServersReplyBodyType,
  type getOneServerParamsSchemaType,
  type getOneServerReplyBodyType,
  type tryInfoReplyBodyType,
  type tryInfoRequestBodyType,
} from "./servers.schema";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const serversRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               Get All Servers                              */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.SERVERS],
        summary: "Get list of servers",
        description:
          "Returns a list of servers accessible to the authenticated user",
        response: {
          200: getServersReplyBody,
          401: UnauthorizedError,
        },
      },
    },
    getAllServers
  );
  /* -------------------------------------------------------------------------- */
  /*                               Get My Servers                               */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Querystring: getMyServersParamsSchemaType;
    Reply: getMyServersReplyBodyType;
  }>(
    "/my-servers",
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
        tags: [swaggerTags.SERVERS],
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
        tags: [swaggerTags.SERVERS],
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
        tags: [swaggerTags.SERVERS],
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

export default serversRoute;
