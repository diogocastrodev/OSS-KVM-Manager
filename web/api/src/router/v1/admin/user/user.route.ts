import type { FastifyPluginAsync } from "fastify";
import {
  forceEmailVerificationReplyBody,
  forceEmailVerificationRequestParams,
  getUsersByPageQuery,
  getUsersByPageReplyBody,
  registerUserAdminReplyBody,
  registerUserAdminRequestBody,
  updateUserAdminReplyBody,
  updateUserAdminRequestBody,
  updateUserAdminRequestParams,
  type ForceEmailVerificationReplyBodyType,
  type ForceEmailVerificationRequestParamsType,
  type GetUsersByPageQueryType,
  type GetUsersByPageReplyBodyType,
  type RegisterUserAdminReplyBodyType,
  type RegisterUserAdminRequestBodyType,
  type UpdateUserAdminReplyBodyType,
  type UpdateUserAdminRequestBodyType,
  type UpdateUserAdminRequestParamsType,
} from "./user.schema";
import {
  forceEmailVerification,
  getUsersByPage,
  registerUserAdmin,
  updateUserAdmin,
} from "./user.controller";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  type BadRequestErrorType,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const userAdminRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: RegisterUserAdminRequestBodyType;
    Reply: RegisterUserAdminReplyBodyType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.USERS],
        summary: "Register a new user",
        description: "Registers a new user",
        body: registerUserAdminRequestBody,
        response: {
          200: registerUserAdminReplyBody,
          401: UnauthorizedError,
        },
      },
    },
    registerUserAdmin,
  );

  fastify.get<{
    Querystring: GetUsersByPageQueryType;
    Reply:
      | GetUsersByPageReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType
      | BadRequestErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.USERS],
        summary: "Get users by page",
        description: "Retrieves a paginated list of users",
        querystring: getUsersByPageQuery,
        response: {
          200: getUsersByPageReplyBody,
          400: BadRequestError,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getUsersByPage,
  );

  fastify.put<{
    Params: UpdateUserAdminRequestParamsType;
    Body: UpdateUserAdminRequestBodyType;
    Reply:
      | UpdateUserAdminReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType
      | BadRequestErrorType;
  }>(
    "/:id",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.USERS],
        summary: "Update user",
        description: "Updates a user's information",
        params: updateUserAdminRequestParams,
        body: updateUserAdminRequestBody,
        response: {
          200: updateUserAdminReplyBody,
          400: BadRequestError,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    updateUserAdmin,
  );

  fastify.post<{
    Params: ForceEmailVerificationRequestParamsType;
    Reply:
      | ForceEmailVerificationReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/:id/force-email-verification",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        tags: [swaggerTags.ADMIN.USERS],
        summary: "Force email verification",
        description:
          "Forces a user to verify their email by sending a new confirmation email and invalidating previous tokens",
        params: forceEmailVerificationRequestParams,
        response: {
          200: forceEmailVerificationReplyBody,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    forceEmailVerification,
  );
};

export default userAdminRoute;
