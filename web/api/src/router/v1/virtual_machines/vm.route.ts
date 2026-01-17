import type { FastifyPluginAsync } from "fastify";
import {
  getVirtualMachineByIdParamsSchema,
  type CreateVirtualSessionBody,
  type CreateVirtualSessionResponse,
  type GetVirtualMachineByIdParams,
} from "./vm.schema";
import {
  createVirtualSession,
  getMyVirtualMachines,
  getVirtualMachineById,
} from "./vm.controller";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
} from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const vmsRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                             My Virtual Machines                            */
  /* -------------------------------------------------------------------------- */
  fastify.get<{}>(
    "/",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.VIRTUAL_MACHINES],
        summary: "Get My Virtual Machines",
        description:
          "Retrieves a list of virtual machines owned by the authenticated user.",
      },
    },
    getMyVirtualMachines
  );
  /* -------------------------------------------------------------------------- */
  /*                             Get Virtual Machine                            */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Params: GetVirtualMachineByIdParams;
  }>(
    "/:vmPublicId",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.VIRTUAL_MACHINES],
        summary: "Get Virtual Machine",
        description:
          "Retrieves details of a specific virtual machine by its ID.",
        params: getVirtualMachineByIdParamsSchema,
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    getVirtualMachineById
  );
  /* -------------------------------------------------------------------------- */
  /*                           Update Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                         Add User to Virtual Machine                        */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                       Update User in Virtual Machine                       */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                      Remove User from Virtual Machine                      */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                     Virtual Session to Virtual Machine                     */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Params: CreateVirtualSessionBody;
    Reply: CreateVirtualSessionResponse | NotFoundErrorType;
  }>(
    "/:vmPublicId/console",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.VIRTUAL_MACHINES],
        summary: "Virtual Session to Virtual Machine",
        description:
          "Creates a virtual session to access the virtual machine's console.",
        params: getVirtualMachineByIdParamsSchema,
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    createVirtualSession
  );
};

export default vmsRoute;
