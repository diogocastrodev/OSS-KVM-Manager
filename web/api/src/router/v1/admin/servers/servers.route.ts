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
  type healthCheckParamsSchemaType,
  type healthCheckReplyBodyType,
  healthCheckParamsSchema,
  healthCheckReplyBody,
  type getVMsOfServerParamsSchemaType,
  type getVMsOfServerReplyBodyType,
  getVMsOfServerParamsSchema,
  getVMsOfServerReplyBody,
  type deleteServerParamsSchemaType,
  type deleteServerReplyBodyType,
  deleteServerParamsSchema,
  deleteServerReplyBody,
  type updateServerParamsSchemaType,
  type updateServerRequestBodyType,
  type updateServerReplyBodyType,
  updateServerParamsSchema,
  updateServerRequestBody,
  updateServerReplyBody,
  type getServersHealthReplyBodyType,
  getServersHealthReplyBody,
} from "./servers.schema";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import {
  createServer,
  deleteServer,
  getAllServers,
  getAllServersHealth,
  getOneServer,
  getVMsOfServer,
  healthCheckServer,
  tryInfo,
  updateServer,
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
    getAllServers,
  );
  /* -------------------------------------------------------------------------- */
  /*                            Get Servers Health                              */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Reply: getServersHealthReplyBodyType | UnauthorizedErrorType;
  }>(
    "/health",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Get servers health",
        description:
          "Returns a list of servers accessible to the authenticated user",
        response: {
          200: getServersHealthReplyBody,
          401: UnauthorizedError,
        },
      },
    },
    getAllServersHealth,
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
    getOneServer,
  );

  /* -------------------------------------------------------------------------- */
  /*                               Get One Server VMs                           */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Params: getVMsOfServerParamsSchemaType;
    Reply: getVMsOfServerReplyBodyType | NotFoundErrorType;
  }>(
    "/:publicId/vms",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Get VMs of a specific server",
        description:
          "Returns details of the virtual machines of a server identified by publicId if accessible to the authenticated user",
        params: getVMsOfServerParamsSchema,
        response: {
          200: getVMsOfServerReplyBody,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getVMsOfServer,
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
    tryInfo,
  );
  /* -------------------------------------------------------------------------- */
  /*                                Health Check                                */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Params: healthCheckParamsSchemaType;
    Reply: healthCheckReplyBodyType | NotFoundErrorType | UnauthorizedErrorType;
  }>(
    "/:publicId/health-check",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Check if Server is Alive",
        description: "Perform a health check to see if the server is alive.",
        params: healthCheckParamsSchema,
        response: {
          200: healthCheckReplyBody,
          404: NotFoundError,
          401: UnauthorizedError,
        },
      },
    },
    healthCheckServer,
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
    createServer,
  );
  /* -------------------------------------------------------------------------- */
  /*                                Update Server                               */
  /* -------------------------------------------------------------------------- */
  fastify.put<{
    Params: updateServerParamsSchemaType;
    Body: updateServerRequestBodyType;
    Reply:
      | updateServerReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/:publicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Update an existing server",
        description:
          "Update details of an existing server entry in the system.",
        params: updateServerParamsSchema,
        body: updateServerRequestBody,
        response: {
          200: updateServerReplyBody,
          404: NotFoundError,
          401: UnauthorizedError,
        },
      },
    },
    updateServer,
  );
  /* -------------------------------------------------------------------------- */
  /*                                Delete Server                               */
  /* -------------------------------------------------------------------------- */
  fastify.delete<{
    Params: deleteServerParamsSchemaType;
    Reply:
      | deleteServerReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/:publicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.SERVERS],
        summary: "Delete a server",
        description: "Delete a server entry from the system.",
        params: deleteServerParamsSchema,
        response: {
          204: deleteServerReplyBody,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    deleteServer,
  );
};

export default serversAdminRoute;
