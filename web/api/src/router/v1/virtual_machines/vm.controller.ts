import db from "@/db/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateVirtualSessionBody,
  CreateVirtualSessionResponse,
  GetVirtualMachineByIdParams,
} from "./vm.schema";
import type { NotFoundErrorType } from "@/types/errorSchema";
import { createVirtualSessionEncryptToken } from "@/utils/vmConsole";
import env from "@/utils/env";

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

/* -------------------------------------------------------------------------- */
/*                               Virtual Session                              */
/* -------------------------------------------------------------------------- */
export const createVirtualSession = async (
  req: FastifyRequest<{
    Params: CreateVirtualSessionBody;
  }>,
  reply: FastifyReply<{
    Reply: CreateVirtualSessionResponse | NotFoundErrorType;
  }>
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
    .innerJoin("servers", "virtual_machines.serverId", "servers.id")
    .select([
      "virtual_machines_users.role as userRole",
      "servers.ipLocal as targetHost",
      "servers.agent_port as targetPort",
    ])
    .where("users.email", "=", email)
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({
      message: `Virtual machine with public ID ${vmPublicId} not found.`,
    });
  }

  if (vm.userRole !== "OWNER" && vm.userRole !== "OPERATOR") {
    return reply.status(403).send({
      message: `You do not have permission to create a session for virtual machine with public ID ${vmPublicId}.`,
    });
  }

  const token = await createVirtualSessionEncryptToken({
    email: email,
    vm: vmPublicId,
    targetHost: vm.targetHost,
    targetPort: parseInt("22222"), // TODO: CHANGE THIS
  });

  reply.setCookie(`vm-console-${vmPublicId}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 120,
  });

  return reply.status(200).send({
    token: token,
  });
};
