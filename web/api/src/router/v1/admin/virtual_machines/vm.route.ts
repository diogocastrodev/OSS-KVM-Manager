import type { FastifyPluginAsync } from "fastify";
import {
  adminCreateVirtualMachine,
  adminDeleteVirtualMachine,
  adminGetAllVirtualMachines,
  adminGetVirtualMachineById,
  adminUpdateVirtualMachine,
} from "./vm.controller";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  type BadRequestErrorType,
  type InternalServerErrorType,
  type NotFoundErrorType,
} from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";
import {
  adminCreateVirtualMachineBodySchema,
  adminCreateVirtualMachineReplySchema,
  type AdminCreateVirtualMachineBody,
  type AdminCreateVirtualMachineReply,
} from "./vm.schema";

const vmAdminRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                          Get All Virtual Machines                          */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/",
    {
      schema: {
        description: "Get all virtual machines",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
        },
      },
    },
    adminGetAllVirtualMachines
  );
  /* -------------------------------------------------------------------------- */
  /*                        Get One Virtual Machine By ID                       */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/:vmPublicId",
    {
      schema: {
        description: "Get a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminGetVirtualMachineById
  );
  /* -------------------------------------------------------------------------- */
  /*                           Create Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Body: AdminCreateVirtualMachineBody;
    Reply:
      | AdminCreateVirtualMachineReply
      | NotFoundErrorType
      | BadRequestErrorType
      | InternalServerErrorType;
  }>(
    "/",
    {
      schema: {
        description: "Create a new virtual machine",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        body: adminCreateVirtualMachineBodySchema,
        response: {
          200: adminCreateVirtualMachineReplySchema,
          400: BadRequestError,
          401: UnauthorizedError,
          404: NotFoundError,
          500: InternalServerError,
        },
      },
    },
    adminCreateVirtualMachine
  );
  /* -------------------------------------------------------------------------- */
  /*                           Update Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.put(
    "/:vmPublicId",
    {
      schema: {
        description: "Update a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminUpdateVirtualMachine
  );
  /* -------------------------------------------------------------------------- */
  /*                           Delete Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.delete(
    "/:vmPublicId",
    {
      schema: {
        description: "Delete a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminDeleteVirtualMachine
  );
};

export default vmAdminRoute;
