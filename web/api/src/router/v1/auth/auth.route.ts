import type { FastifyPluginAsync } from "fastify";
import { login, register } from "./auth.controller";
import {
  loginReplyBody,
  loginReplyBodyError,
  loginRequestBody,
  registerReplyBody,
  registerRequestBody,
} from "./auth.schema";

const authRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                                  Register                                  */
  /* -------------------------------------------------------------------------- */
  fastify.post(
    "/register",
    {
      schema: {
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
  fastify.post(
    "/login",
    {
      schema: {
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
      schema: {
        response: {},
      },
    },
    () => {}
  );
  /* -------------------------------------------------------------------------- */
  /*                                Refresh Token                               */
  /* -------------------------------------------------------------------------- */
  fastify.post(
    "/refresh",
    {
      schema: {
        response: {
          200: loginReplyBody,
          401: loginReplyBodyError,
        },
      },
    },
    () => {}
  );
};

export default authRoute;
