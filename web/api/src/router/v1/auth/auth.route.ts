import type { FastifyPluginAsync } from "fastify";
import {
  confirmEmailGet,
  confirmEmailPost,
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
} from "./auth.controller";
import {
  confirmEmailGetReplyBody,
  confirmEmailParams,
  confirmEmailPostReplyBody,
  confirmEmailPostRequestBody,
  loginReplyBody,
  loginReplyBodyError,
  loginRequestBody,
  passwordResetBody,
  passwordResetReplyBody,
  passwordResetRequestBody,
  passwordResetRequestReplyBody,
  refreshReplyBody,
  refreshReplyBodyError,
  type confirmEmailGetReplyBodyType,
  type confirmEmailParamsType,
  type confirmEmailPostReplyBodyType,
  type confirmEmailPostRequestBodyType,
  type loginReplyBodyType,
  type loginRequestBodyType,
  type passwordResetBodyType,
  type passwordResetReplyBodyType,
  type passwordResetRequestBodyType,
  type passwordResetRequestReplyBodyType,
  type refreshReplyBodyType,
} from "./auth.schema";
import swaggerTags from "@/types/swaggerTags";
import { NotFoundError, type NotFoundErrorType } from "@/types/errorSchema";

const authRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                                  Register                                  */
  /* -------------------------------------------------------------------------- */
  // fastify.post<{
  //   Body: registerRequestBodyType;
  //   Reply: registerReplyBodyType;
  // }>(
  //   "/register",
  //   {
  //     preValidation: [fastify.guestOnly],
  //     schema: {
  //       tags: [swaggerTags.AUTH],
  //       body: registerRequestBody,
  //       response: {
  //         201: registerReplyBody,
  //       },
  //     },
  //   },
  //   register
  // );
  /* -------------------------------------------------------------------------- */
  /*                                Confirm Email                               */
  /* -------------------------------------------------------------------------- */
  // Check if token is valid
  fastify.get<{
    Params: confirmEmailParamsType;
    Reply: confirmEmailGetReplyBodyType;
  }>(
    "/confirm-email/:token",
    {
      preValidation: [fastify.guestOnly],
      schema: {
        tags: [swaggerTags.AUTH],
        description:
          "Confirm user's email using the token sent to their email address",
        params: confirmEmailParams,
        response: {
          200: confirmEmailGetReplyBody,
          401: NotFoundError,
        },
      },
    },
    confirmEmailGet
  );
  // Verify Token
  fastify.post<{
    Body: confirmEmailPostRequestBodyType;
    Reply: confirmEmailPostReplyBodyType;
  }>(
    "/confirm-email",
    {
      preValidation: [fastify.guestOnly],
      schema: {
        tags: [swaggerTags.AUTH],
        description:
          "Confirm user's email using the token sent to their email address",
        body: confirmEmailPostRequestBody,
        response: {
          200: confirmEmailPostReplyBody,
          401: NotFoundError,
        },
      },
    },
    confirmEmailPost
  );
  /* -------------------------------------------------------------------------- */
  /*                               Password Reset                               */
  /* -------------------------------------------------------------------------- */
  /* --------------------------------- Request -------------------------------- */
  fastify.post<{
    Body: passwordResetRequestBodyType;
    Reply: passwordResetRequestReplyBodyType;
  }>(
    "/password-reset",
    {
      preValidation: [fastify.guestOnly],
      schema: {
        tags: [swaggerTags.AUTH],
        description: "Request a password reset link via email",
        body: passwordResetRequestBody,
        response: {
          200: passwordResetRequestReplyBody,
        },
      },
    },
    requestPasswordReset
  );
  /* ---------------------------------- Reset --------------------------------- */
  fastify.put<{
    Body: passwordResetBodyType;
    Reply: passwordResetReplyBodyType | NotFoundErrorType;
  }>(
    "/password-reset",
    {
      preValidation: [fastify.guestOnly],
      schema: {
        tags: [swaggerTags.AUTH],
        description: "Reset password using the token sent via email",
        body: passwordResetBody,
        response: {
          200: passwordResetReplyBody,
          401: NotFoundError,
        },
      },
    },
    resetPassword
  );
  /* -------------------------------------------------------------------------- */
  /*                                    Login                                   */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Body: loginRequestBodyType;
    Reply: loginReplyBodyType;
  }>(
    "/login",

    {
      config: {
        csrf: false,
      },
      preValidation: [fastify.guestOnly],
      schema: {
        tags: [swaggerTags.AUTH],
        summary: "Login user and get JWT access token",
        description: "For API's, check cookies for refresh token",
        body: loginRequestBody,
        response: {
          200: loginReplyBody,
          401: loginReplyBodyError,
        },
      },
    },
    login
  );
  /* -------------------------------------------------------------------------- */
  /*                                   Logout                                   */
  /* -------------------------------------------------------------------------- */
  fastify.post(
    "/logout",
    {
      config: {
        csrf: false,
      },
      schema: {
        tags: [swaggerTags.AUTH],
      },
    },
    logout
  );
  /* -------------------------------------------------------------------------- */
  /*                                Refresh Token                               */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Reply: refreshReplyBodyType;
  }>(
    "/refresh",
    {
      config: {
        csrf: false,
      },
      schema: {
        tags: [swaggerTags.AUTH],
        response: {
          200: refreshReplyBody,
          401: refreshReplyBodyError,
        },
      },
    },
    refresh
  );
};

export default authRoute;
