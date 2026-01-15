import db from "@/db/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetVirtualMachineByIdParams } from "./vm.schema";

/* -------------------------------------------------------------------------- */
/*                           Get My Virtual Machines                          */
/* -------------------------------------------------------------------------- */
export const getMyVirtualMachines = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const email = req.user.email;

  const vms = await db
    .selectFrom("virtual_machines")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId"
    )
    .innerJoin("users", "virtual_machines_users.userId", "users.id")
    .selectAll("virtual_machines")
    .where("users.email", "=", email)
    .execute();

  return reply.status(200).send({ virtualMachines: vms });
};

/* -------------------------------------------------------------------------- */
/*                          Get Virtual Machine By ID                         */
/* -------------------------------------------------------------------------- */
export const getVirtualMachineById = async (
  req: FastifyRequest<{
    Params: GetVirtualMachineByIdParams;
  }>,
  reply: FastifyReply
) => {
  const email = req.user.email;
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId"
    )
    .innerJoin("users", "virtual_machines_users.userId", "users.id")
    .selectAll("virtual_machines")
    .where("users.email", "=", email)
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({
      error: "Not Found",
      message: `Virtual machine with public ID ${vmPublicId} not found.`,
      statusCode: 404,
    });
  }

  return reply.status(200).send(vm);
};
