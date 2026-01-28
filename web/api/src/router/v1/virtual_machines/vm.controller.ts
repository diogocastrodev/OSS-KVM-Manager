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
  reply: FastifyReply,
) => {
  const email = req.user.email;

  const vms = await db
    .selectFrom("virtual_machines")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId",
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
  reply: FastifyReply,
) => {
  const email = req.user.email;
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId",
    )
    .innerJoin("users", "virtual_machines_users.userId", "users.id")
    .select([
      "virtual_machines.name",
      "virtual_machines.publicId",
      "virtual_machines.vcpus",
      "virtual_machines.ram",
      "virtual_machines.disk",
      "virtual_machines.in_avg",
      "virtual_machines.out_avg",
      "virtual_machines.ipLocal",
      "virtual_machines.ipPublic",
      "virtual_machines.createdAt",
      "virtual_machines.updatedAt",
      "virtual_machines.mac",
      "virtual_machines_users.role",
    ])
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

  const server = await db
    .selectFrom("servers")
    .innerJoin("virtual_machines", "servers.id", "virtual_machines.serverId")
    .select([
      "servers.ipLocal as serverIpLocal",
      "servers.agent_port as serverAgentPort",
      "virtual_machines.id as vmId",
    ])
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(200).send({ state: "unknown", ...vm });
  }

  try {
    const d = await fetch(
      `http://${server.serverIpLocal}:${server.serverAgentPort}/api/v1/vms/${server.vmId}/status`,
      {
        method: "GET",
        signal: AbortSignal.timeout(600),
      },
    );

    if (!d.ok) {
      return reply.status(200).send({ state: "unknown", ...vm });
    }

    const statusData = await d.json();

    return reply.status(200).send({ state: statusData.vm.status, ...vm });
  } catch (e) {
    return reply.status(200).send({ state: "unknown", ...vm });
  }
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
  }>,
) => {
  const email = req.user.email;
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId",
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
