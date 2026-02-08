import {
  DeleteSubUserBodySchema,
  DeleteSubUserResponseSchema,
  GetAllSubusersResponseSchema,
  SubUserParamsSchema,
  type DeleteSubUserBody,
  type DeleteSubUserResponse,
  type GetAllSubusersResponse,
  type SubUserParams,
} from "@/router/v1/virtual_machines/subuser/subuser.schema";
import type { NotFoundErrorType } from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";
import type { FastifyPluginAsync } from "fastify";
import { DeleteSubUser, GetAllSubusers } from "./subusers.controller";

const subUsers: FastifyPluginAsync = async (fastify) => {
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

  fastify.delete<{
    Body: DeleteSubUserBody;
    Reply: DeleteSubUserResponse | NotFoundErrorType;
  }>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [
          swaggerTags.VIRTUAL_MACHINES,
          swaggerTags.VIRTUAL_MACHINES_SUBUSERS,
        ],
        body: DeleteSubUserBodySchema,
        response: {
          200: DeleteSubUserResponseSchema,
        },
      },
    },
    DeleteSubUser,
  );
};

export default subUsers;
