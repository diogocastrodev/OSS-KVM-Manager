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
  AdminDeleteVirtualMachineParamsSchema,
  AdminDeleteVirtualMachineReplySchema,
  adminGetVirtualMachineByIdParamsSchema,
  adminGetVirtualMachineByIdReplySchema,
  adminGetVirtualMachinesByIdQuerySchema,
  AdminUpdateVirtualMachineBodySchema,
  AdminUpdateVirtualMachineParamsSchema,
  AdminUpdateVirtualMachineReplySchema,
  type AdminCreateVirtualMachineBody,
  type AdminCreateVirtualMachineReply,
  type AdminDeleteVirtualMachineParams,
  type AdminDeleteVirtualMachineReply,
  type AdminGetVirtualMachineByIdParams,
  type AdminGetVirtualMachineByIdReply,
  type AdminGetVirtualMachinesByIdQuery,
  type AdminUpdateVirtualMachineBody,
  type AdminUpdateVirtualMachineParams,
  type AdminUpdateVirtualMachineReply,
} from "./vm.schema";
import subUsers from "./subusers/subusers.route";

const vmAdminRoute: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                          Get All Virtual Machines                          */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        description: "Get all virtual machines",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
        },
      },
    },
    adminGetAllVirtualMachines,
  );
  /* -------------------------------------------------------------------------- */
  /*                        Get all Virtual Machines tiny                       */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/tiny",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        description: "Get all virtual machines (tiny)",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        response: {
          401: UnauthorizedError,
        },
      },
    },
    () => {},
  );
  /* -------------------------------------------------------------------------- */
  /*                        Get One Virtual Machine By ID                       */
  /* -------------------------------------------------------------------------- */
  fastify.get<{
    Querystring: AdminGetVirtualMachinesByIdQuery;
    Params: AdminGetVirtualMachineByIdParams;
    // Reply: AdminGetVirtualMachineByIdReply | NotFoundErrorType;
  }>(
    "/:vmPublicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        description: "Get a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        querystring: adminGetVirtualMachinesByIdQuerySchema,
        params: adminGetVirtualMachineByIdParamsSchema,
        response: {
          // 200: adminGetVirtualMachineByIdReplySchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminGetVirtualMachineById,
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
      preValidation: [fastify.authRequired, fastify.adminOnly],
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
    adminCreateVirtualMachine,
  );
  /* -------------------------------------------------------------------------- */
  /*                           Update Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.put<{
    Params: AdminUpdateVirtualMachineParams;
    Body: AdminUpdateVirtualMachineBody;
    Reply: AdminUpdateVirtualMachineReply | NotFoundErrorType;
  }>(
    "/:vmPublicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        description: "Update a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        params: AdminUpdateVirtualMachineParamsSchema,
        body: AdminUpdateVirtualMachineBodySchema,
        response: {
          200: AdminUpdateVirtualMachineReplySchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminUpdateVirtualMachine,
  );
  /* -------------------------------------------------------------------------- */
  /*                           Delete Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.delete<{
    Params: AdminDeleteVirtualMachineParams;
    Reply: AdminDeleteVirtualMachineReply | NotFoundErrorType;
  }>(
    "/:vmPublicId",
    {
      preValidation: [fastify.authRequired, fastify.adminOnly],
      schema: {
        description: "Delete a virtual machine by ID",
        tags: [swaggerTags.ADMIN.VIRTUAL_MACHINES],
        params: AdminDeleteVirtualMachineParamsSchema,
        response: {
          200: AdminDeleteVirtualMachineReplySchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    adminDeleteVirtualMachine,
  );

  fastify.register(subUsers, {
    prefix: "/:vmPublicId/subusers",
  });
};

export default vmAdminRoute;
