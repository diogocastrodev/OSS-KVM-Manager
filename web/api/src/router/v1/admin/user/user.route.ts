import type { FastifyPluginAsync } from "fastify";
import {
  registerUserAdminReplyBody,
  registerUserAdminRequestBody,
  type RegisterUserAdminReplyBodyType,
  type RegisterUserAdminRequestBodyType,
} from "./user.schema";
import { registerUserAdmin } from "./user.controller";
import { UnauthorizedError } from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const userAdminRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: RegisterUserAdminRequestBodyType;
    Reply: RegisterUserAdminReplyBodyType;
  }>(
    "/register",
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
    registerUserAdmin
  );
};

export default userAdminRoute;
