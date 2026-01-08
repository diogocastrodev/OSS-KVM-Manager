import db from "@/db/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetVirtualMachineByIdParams } from "./vm.schema";

/* -------------------------------------------------------------------------- */
/*                           Get My Virtual Machines                          */
/* -------------------------------------------------------------------------- */
export const getMyVirtualMachines = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};

/* -------------------------------------------------------------------------- */
/*                          Get Virtual Machine By ID                         */
/* -------------------------------------------------------------------------- */
export const getVirtualMachineById = async (
  req: FastifyRequest<{
    Params: GetVirtualMachineByIdParams;
  }>,
  reply: FastifyReply
) => {};
