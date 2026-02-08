import type { FastifyPluginAsync } from "fastify";
import {
  changeVMStatusBodySchema,
  changeVMStatusParamsSchema,
  changeVMStatusResponseSchema,
  formatVirtualMachineBodySchema,
  formatVirtualMachineParamsSchema,
  formatVirtualMachineResponseSchema,
  getVirtualMachineByIdParamsSchema,
  type ChangeVMStatusBody,
  type ChangeVMStatusParams,
  type ChangeVMStatusResponse,
  type CreateVirtualSessionBody,
  type CreateVirtualSessionResponse,
  type FormatVirtualMachineBody,
  type FormatVirtualMachineParams,
  type FormatVirtualMachineResponse,
  type GetVirtualMachineByIdParams,
} from "./vm.schema";
import {
  changeVMStatus,
  createVirtualSession,
  formatVirtualMachine,
  getMyVirtualMachines,
  getVirtualMachineById,
} from "./vm.controller";
import {
  NotFoundError,
  UnauthorizedError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import swaggerTags from "@/types/swaggerTags";
import vmsSubUserRoute from "./subuser/subuser.route";

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
    getMyVirtualMachines,
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
    getVirtualMachineById,
  );
  /* -------------------------------------------------------------------------- */
  /*                           Update Virtual Machine                           */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                           Format Virtual Machine                           */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Params: FormatVirtualMachineParams;
    Body: FormatVirtualMachineBody;
    Reply:
      | FormatVirtualMachineResponse
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>(
    "/:vmPublicId/format",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.VIRTUAL_MACHINES],
        summary: "Format Virtual Machine",
        description:
          "Formats the virtual machine, erasing all data and restoring it to its initial state.",
        params: formatVirtualMachineParamsSchema,
        body: formatVirtualMachineBodySchema,
        response: {
          200: formatVirtualMachineResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    formatVirtualMachine,
  );

  /* -------------------------------------------------------------------------- */
  /*                                  Sub Users                                 */
  /* -------------------------------------------------------------------------- */
  fastify.register(vmsSubUserRoute, { prefix: "/:vmPublicId/subusers" });
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
    createVirtualSession,
  );

  /* -------------------------------------------------------------------------- */
  /*                              Change VM State                              */
  /* -------------------------------------------------------------------------- */
  fastify.post<{
    Params: ChangeVMStatusParams;
    Body: ChangeVMStatusBody;
    Reply: ChangeVMStatusResponse | NotFoundErrorType | UnauthorizedErrorType;
  }>(
    "/:vmPublicId/state",
    {
      preValidation: [fastify.authRequired],
      schema: {
        tags: [swaggerTags.VIRTUAL_MACHINES],
        summary: "Change Virtual Machine State",
        description:
          "Changes the state of the virtual machine (e.g., start, stop, restart, kill).",
        params: changeVMStatusParamsSchema,
        body: changeVMStatusBodySchema,
        response: {
          200: changeVMStatusResponseSchema,
          401: UnauthorizedError,
          404: NotFoundError,
        },
      },
    },
    changeVMStatus,
  );
};

export default vmsRoute;
