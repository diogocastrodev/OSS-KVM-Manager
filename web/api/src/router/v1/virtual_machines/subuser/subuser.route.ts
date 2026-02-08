import type { FastifyPluginAsync } from "fastify";
import {
  CreateSubuser,
  DeleteSubUser,
  GetAllSubusers,
  UpdateSubUser,
} from "./subuser.controller";
import {
  CreateUserBodySchema,
  CreateUserResponseSchema,
  DeleteSubUserBodySchema,
  DeleteSubUserResponseSchema,
  GetAllSubusersResponseSchema,
  SubUserParamsSchema,
  UpdateUserBodySchema,
  UpdateUserResponseSchema,
  type CreateUserBody,
  type CreateUserResponse,
  type DeleteSubUserBody,
  type DeleteSubUserResponse,
  type GetAllSubusersResponse,
  type SubUserParams,
  type UpdateUserBody,
  type UpdateUserResponse,
} from "./subuser.schema";
import swaggerTags from "@/types/swaggerTags";
import {
  ForbiddenError,
  NotFoundError,
  type ForbiddenErrorType,
  type NotFoundErrorType,
} from "@/types/errorSchema";

const vmsSubUserRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                        Get Users in Virtual Machine                        */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Params: SubUserParams;
    Reply: GetAllSubusersResponse | NotFoundErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [
          swaggerTags.VIRTUAL_MACHINES,
          swaggerTags.VIRTUAL_MACHINES_SUBUSERS,
        ],
        params: SubUserParamsSchema,
        response: {
          200: GetAllSubusersResponseSchema,
        },
      },
    },
    GetAllSubusers,
  );
  /* -------------------------------------------------------------------------- */
  /*                         Add User to Virtual Machine                        */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Params: SubUserParams;
    Body: CreateUserBody;
    Reply: CreateUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [
          swaggerTags.VIRTUAL_MACHINES,
          swaggerTags.VIRTUAL_MACHINES_SUBUSERS,
        ],
        params: SubUserParamsSchema,
        body: CreateUserBodySchema,
        response: {
          201: CreateUserResponseSchema,
          403: ForbiddenError,
          404: NotFoundError,
        },
      },
    },
    CreateSubuser,
  );
  /* -------------------------------------------------------------------------- */
  /*                       Update User in Virtual Machine                       */
  /* -------------------------------------------------------------------------- */
  fastify.put<{
    Params: SubUserParams;
    Body: UpdateUserBody;
    Reply: UpdateUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [
          swaggerTags.VIRTUAL_MACHINES,
          swaggerTags.VIRTUAL_MACHINES_SUBUSERS,
        ],
        params: SubUserParamsSchema,
        body: UpdateUserBodySchema,
        response: {
          200: UpdateUserResponseSchema,
          403: ForbiddenError,
          404: NotFoundError,
        },
      },
    },
    UpdateSubUser,
  );
  /* -------------------------------------------------------------------------- */
  /*                      Remove User from Virtual Machine                      */
  /* -------------------------------------------------------------------------- */
  fastify.delete<{
    Params: SubUserParams;
    Body: DeleteSubUserBody;
    Reply: DeleteSubUserResponse | NotFoundErrorType | ForbiddenErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [
          swaggerTags.VIRTUAL_MACHINES,
          swaggerTags.VIRTUAL_MACHINES_SUBUSERS,
        ],
        params: SubUserParamsSchema,
        body: DeleteSubUserBodySchema,
        response: {
          200: DeleteSubUserResponseSchema,
          403: ForbiddenError,
          404: NotFoundError,
        },
      },
    },
    DeleteSubUser,
  );
};

export default vmsSubUserRoute;
