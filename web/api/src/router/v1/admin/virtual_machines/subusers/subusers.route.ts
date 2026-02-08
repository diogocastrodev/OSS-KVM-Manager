import {
  GetAllSubusersResponseSchema,
  SubUserParamsSchema,
  type GetAllSubusersResponse,
  type SubUserParams,
} from "@/router/v1/virtual_machines/subuser/subuser.schema";
import type { NotFoundErrorType } from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";
import type { FastifyPluginAsync } from "fastify";
import { GetAllSubusers } from "./subusers.controller";

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
};

export default subUsers;
