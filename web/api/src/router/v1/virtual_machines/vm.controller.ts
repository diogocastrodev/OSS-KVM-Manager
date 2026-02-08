import db from "@/db/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ChangeVMStatusBody,
  ChangeVMStatusParams,
  ChangeVMStatusResponse,
  CreateVirtualSessionBody,
  CreateVirtualSessionResponse,
  FormatVirtualMachineBody,
  FormatVirtualMachineParams,
  FormatVirtualMachineResponse,
  GetVirtualMachineByIdParams,
} from "./vm.schema";
import type {
  NotFoundErrorType,
  UnauthorizedErrorType,
} from "@/types/errorSchema";
import { createVirtualSessionEncryptToken } from "@/utils/vmConsole";
import env from "@/utils/env";
import { pollFinalizeUntilOperational } from "@/utils/pool";
import type { AgentRoutes, PreparedRequest } from "@/utils/agentRoutes";
import normalizeNames from "@/utils/normalizeName";
import { netmaskToCidr } from "@/utils/network";

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
      "virtual_machines.status",
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
/*                           Format Virtual Machine                           */
/* -------------------------------------------------------------------------- */
export const formatVirtualMachine = async (
  req: FastifyRequest<{
    Params: FormatVirtualMachineParams;
    Body: FormatVirtualMachineBody;
  }>,
  reply: FastifyReply<{
    Reply: FormatVirtualMachineResponse | NotFoundErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;

  // Allow only admins or users with access to the VM to format it
  if (req.user.role !== "ADMIN") {
    const u = await db
      .selectFrom("virtual_machines_users")
      .innerJoin("users", "virtual_machines_users.userId", "users.id")
      .innerJoin(
        "virtual_machines",
        "virtual_machines_users.virtualMachinesId",
        "virtual_machines.id",
      )
      .select(["virtual_machines_users.role"])
      .where("users.email", "=", req.user.email)
      .where("virtual_machines.publicId", "=", vmPublicId)
      .executeTakeFirst();

    if (!u) {
      return reply.status(404).send({ message: "Virtual machine not found" });
    }

    if (u.role !== "OWNER" && u.role !== "OPERATOR") {
      return reply.status(403).send({ message: "Forbidden" });
    }
  }

  if (req.body.host) {
    req.body.host.hostname = normalizeNames(req.body.host.hostname);
    req.body.host.username = normalizeNames(req.body.host.username);

    if (
      req.body.host.hostname.length === 0 ||
      req.body.host.username.length === 0
    ) {
      return reply.status(400).send({
        message:
          "Invalid host information. Hostname and username must contain at least one alphanumeric character.",
      });
    }

    if (req.body.host.password && req.body.host.password.length === 0) {
      delete req.body.host.password;
    }

    if (req.body.host.publicKey && req.body.host.publicKey.length === 0) {
      delete req.body.host.publicKey;
    }

    if (!req.body.host.password && !req.body.host.publicKey) {
      return reply.status(400).send({
        message:
          "Invalid host information. Either password or public key must be provided.",
      });
    }
  }

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin("servers", "virtual_machines.serverId", "servers.id")
    .select([
      "virtual_machines.id",
      "virtual_machines.mac",
      "virtual_machines.ipLocal as vmIpLocal",
      "servers.ipLocal",
      "servers.vms_network_mask as vmsNetworkMask",
      "servers.agent_port",
      "servers.vms_gateway",
    ])
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({ message: "Virtual machine not found" });
  }

  const os = await db
    .selectFrom("isos_paths")
    .innerJoin("operative_systems", "isos_paths.osId", "operative_systems.id")
    .selectAll()
    .where("operative_systems.id", "=", req.body.os)
    .executeTakeFirst();

  if (!os) {
    return reply.status(404).send({ message: "OS path not found" });
  }

  const hostProvided = req.body.host && {
    host: {
      hostname: req.body.host.hostname,
      username: req.body.host.username,
      password:
        req.body.host.password && req.body.host.password.length > 0
          ? req.body.host.password
          : undefined,
      public_key:
        req.body.host.publicKey && req.body.host.publicKey.length > 0
          ? req.body.host.publicKey
          : undefined,
    },
  };

  const myIP = await fetch(
    `http://${vm.ipLocal}:${vm.agent_port}/api/v1/my-ip`,
    {
      method: "GET",
      signal: AbortSignal.timeout(600),
    },
  )
    .then((d) => d.json())
    .then((d) => d.ip)
    .catch(() => null);

  // Send format request to agent
  const formatPrepareRoute: PreparedRequest<AgentRoutes["formatVM"]> = {
    method: "POST",
    path: `/api/v1/vms/:vm_id/format`,
    params: {
      vm_id: vm.id,
    },
    body: {
      mode: hostProvided ? "cloud" : "iso",
      vm_id: vm.id,
      ...hostProvided,
      network: {
        mac_address: vm.mac,
        ip_cidr: vm.vmIpLocal,
        prefix: netmaskToCidr(
          vm.vmsNetworkMask ? vm.vmsNetworkMask : "255.255.255.0",
        ),
        gateway: vm.vms_gateway || "",
        dns_servers: [],
      },
      os: {
        os_name: os.path,
        // TODO: Use proper URL construction
        os_url: `http://${myIP}:${env.PORT}/api/v1/agent/os/${os.path}/download`,
      },
    },
  };

  await db
    .updateTable("virtual_machines")
    .set({
      status: "FORMATTING",
      osId: os.osId,
      format_started_at: new Date(),
      format_completed_at: null,
      errorMessage: null,
    })
    .where("id", "=", vm.id)
    .execute();

  if (env.IGNORE_AGENT === true) {
    await new Promise((r) => setTimeout(r, 2100));
  } else {
    const time_now = Date.now();
    // AGENT FETCH
    const formatVM = await fetch(
      `http://${vm.ipLocal}:${vm.agent_port}${formatPrepareRoute.path}`.replace(
        ":vm_id",
        vm.id,
      ),
      {
        method: formatPrepareRoute.method,
        body: JSON.stringify(formatPrepareRoute.body),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const time_end = Date.now();
    console.log(`VM Format fetch took ${time_end - time_now} milliseconds`);
  }
  if (env.IGNORE_AGENT === true) {
    await db
      .updateTable("virtual_machines")
      .set({
        status: "OPERATIONAL",
        format_completed_at: new Date(),
      })
      .where("id", "=", vm.id)
      .execute();
  } else {
    pollFinalizeUntilOperational(
      `http://${vm.ipLocal}:${vm.agent_port}`,
      vm.id,
    );
  }

  return reply.status(200).send({
    message: `Virtual machine with public ID ${vmPublicId} is being formatted.`,
  });
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

  if (req.user.role !== "ADMIN") {
    const u = await db
      .selectFrom("virtual_machines_users")
      .innerJoin("users", "virtual_machines_users.userId", "users.id")
      .innerJoin(
        "virtual_machines",
        "virtual_machines_users.virtualMachinesId",
        "virtual_machines.id",
      )
      .select(["virtual_machines_users.role"])
      .where("users.email", "=", req.user.email)
      .where("virtual_machines.publicId", "=", vmPublicId)
      .executeTakeFirst();

    if (!u) {
      return reply.status(404).send({ message: "Virtual machine not found" });
    }

    if (u.role !== "OWNER" && u.role !== "OPERATOR") {
      return reply.status(403).send({ message: "Forbidden" });
    }
  }

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin("servers", "virtual_machines.serverId", "servers.id")
    .select([
      "servers.ipLocal as targetHost",
      "servers.agent_port as targetPort",
    ])
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({
      message: `Virtual machine with public ID ${vmPublicId} not found.`,
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

/* -------------------------------------------------------------------------- */
/*                              Change VM Status                              */
/* -------------------------------------------------------------------------- */
export const changeVMStatus = async (
  req: FastifyRequest<{
    Params: ChangeVMStatusParams;
    Body: ChangeVMStatusBody;
  }>,
  reply: FastifyReply<{
    Reply: ChangeVMStatusResponse | NotFoundErrorType | UnauthorizedErrorType;
  }>,
) => {
  const email = req.user.email;
  const { vmPublicId } = req.params;
  const { action } = req.body;

  if (req.user.role !== "ADMIN") {
    const u = await db
      .selectFrom("virtual_machines_users")
      .innerJoin("users", "virtual_machines_users.userId", "users.id")
      .innerJoin(
        "virtual_machines",
        "virtual_machines_users.virtualMachinesId",
        "virtual_machines.id",
      )
      .select(["virtual_machines_users.role"])
      .where("users.email", "=", req.user.email)
      .where("virtual_machines.publicId", "=", vmPublicId)
      .executeTakeFirst();

    if (!u) {
      return reply.status(404).send({ message: "Virtual machine not found" });
    }

    if (u.role !== "OWNER" && u.role !== "OPERATOR") {
      return reply.status(403).send({ message: "Forbidden" });
    }
  }

  const vm = await db
    .selectFrom("virtual_machines")
    .innerJoin("servers", "virtual_machines.serverId", "servers.id")
    .select([
      "virtual_machines.id as vmId",
      "servers.ipLocal as targetHost",
      "servers.agent_port as targetPort",
    ])
    .where("virtual_machines.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({
      message: `Virtual machine with public ID ${vmPublicId} not found.`,
    });
  }

  try {
    const d = await fetch(
      `http://${vm.targetHost}:${vm.targetPort}/api/v1/vms/${vm.vmId}/status/${action.toLowerCase()}`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(600),
      },
    );

    if (!d.ok) {
      const errorData = await d.json();
      return reply.status(d.status).send({
        message: errorData.message || "Failed to change VM status",
      });
    }

    const responseData = await d.json();

    return reply.status(200).send({
      message: `Virtual machine with public ID ${vmPublicId} is being ${action.toLowerCase()}ed.`,
    });
  } catch (e) {
    return reply.status(500).send({
      message: "An error occurred while communicating with the agent.",
    });
  }
};
