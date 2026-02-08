import type { FastifyPluginAsync } from "fastify";
import {
  deleteAllUserSessions,
  deleteUserSession,
  getUserProfile,
  getUserSession,
  updateUserPassword,
  updateUserProfile,
} from "./user.controller";
import swaggerTags from "@/types/swaggerTags";
import {
  deleteAllUserAuthResponseSchema,
  deleteUserAuthRequestParamsSchema,
  deleteUserAuthResponseSchema,
  updateUserPasswordRequestSchema,
  updateUserPasswordResponseSchema,
  updateUserProfileRequestSchema,
  updateUserProfileResponseSchema,
  userProfileResponseSchema,
  type DeleteAllUserAuthResponse,
  type DeleteUserAuthRequestParams,
  type DeleteUserAuthResponse,
  type UpdateUserPasswordRequest,
  type UpdateUserPasswordResponse,
  type UpdateUserProfileRequest,
  type UpdateUserProfileResponse,
  type UserProfileResponse,
} from "./user.schema";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";

const usersRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                          Get Informatio from Token                         */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/session",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getUserSession,
  );
  /* -------------------------------------------------------------------------- */
  /*                         Get Information for Profile                        */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Reply: UserProfileResponse | NotFoundErrorType | UnauthorizedErrorType;
  }>(
    "/profile",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        response: {
          200: userProfileResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getUserProfile,
  );
  /* -------------------------------------------------------------------------- */
  /*                              Update User Info                              */
  /* -------------------------------------------------------------------------- */
  fastify.put<{
    Body: UpdateUserProfileRequest;
    Reply:
      | UpdateUserProfileResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/profile",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        body: updateUserProfileRequestSchema,
        response: {
          200: updateUserProfileResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    updateUserProfile,
  );
  /* -------------------------------------------------------------------------- */
  /*                               Update Password                              */
  /* -------------------------------------------------------------------------- */
  fastify.put<{
    Body: UpdateUserPasswordRequest;
    Reply:
      | UpdateUserPasswordResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/password",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        body: updateUserPasswordRequestSchema,
        response: {
          200: updateUserPasswordResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    updateUserPassword,
  );
  /* -------------------------------------------------------------------------- */
  /*                           Remove Auth from Token                           */
  /* -------------------------------------------------------------------------- */
  fastify.delete<{
    Params: DeleteUserAuthRequestParams;
    Reply: DeleteUserAuthResponse | NotFoundErrorType | UnauthorizedErrorType;
  }>(
    "/sessions/:id",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        params: deleteUserAuthRequestParamsSchema,
        response: {
          200: deleteUserAuthResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    deleteUserSession,
  );
  /* -------------------------------------------------------------------------- */
  /*                         Remove Auth from All Tokens                        */
  /* -------------------------------------------------------------------------- */
  fastify.delete<{
    Reply:
      | DeleteAllUserAuthResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/sessions",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.USER],
        response: {
          200: deleteAllUserAuthResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    deleteAllUserSessions,
  );
};

export default usersRoute;
