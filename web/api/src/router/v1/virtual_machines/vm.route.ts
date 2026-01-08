import type { FastifyPluginAsync } from "fastify";
import {
  getVirtualMachineByIdParamsSchema,
  type GetVirtualMachineByIdParams,
} from "./vm.schema";
import { getMyVirtualMachines, getVirtualMachineById } from "./vm.controller";
import { NotFoundError, UnauthorizedError } from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";

const vmsRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                             My Virtual Machines                            */
  /* -------------------------------------------------------------------------- */
  fastify.get<{}>(
    "/",
    {
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
};

export default vmsRoute;
