import type { FastifyPluginAsync } from "fastify";
import { register, login, logout, refresh } from "./auth.controller";
import {
  loginReplyBody,
  loginReplyBodyError,
  loginRequestBody,
  refreshReplyBody,
  refreshReplyBodyError,
  registerReplyBody,
  registerRequestBody,
  type loginReplyBodyType,
  type loginRequestBodyType,
  type refreshReplyBodyType,
  type registerReplyBodyType,
  type registerRequestBodyType,
} from "./auth.schema";

const authRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                                  Register                                  */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Body: registerRequestBodyType;
    Reply: registerReplyBodyType;
  }>(
    "/register",
    {
      preValidation: [fastify.guestOnly],
      schema: {
        tags: ["Auth"],
        body: registerRequestBody,
        response: {
          201: registerReplyBody,
        },
      },
    },
    register
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
