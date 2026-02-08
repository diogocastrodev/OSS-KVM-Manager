import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  createServerReplyBodyType,
  createServerRequestBodyType,
  deleteServerParamsSchemaType,
  deleteServerReplyBodyType,
  getOneServerParamsSchemaType,
  getOneServerReplyBodyType,
  getServersReplyBodyType,
  getServersRequestQueryStringType,
  getVMsOfServerParamsSchemaType,
  getVMsOfServerReplyBodyType,
  healthCheckParamsSchemaType,
  healthCheckReplyBodyType,
  tryInfoReplyBodyType,
  tryInfoRequestBodyType,
  updateServerParamsSchemaType,
  updateServerReplyBodyType,
  updateServerRequestBodyType,
} from "./servers.schema";
import db from "@/db/database";
import type {
  NotFoundErrorType,
  UnauthorizedErrorType,
} from "@/types/errorSchema";
import type { tryInfoType } from "@/types/tryInfoType";
import env from "@/utils/env";
import { calculateNetworkAddress, cidrToNetmask } from "@/utils/network";

/* -------------------------------------------------------------------------- */
/*                               Get All Servers                              */
/* -------------------------------------------------------------------------- */
export const getAllServers = async (
  req: FastifyRequest<{
    Querystring: getServersRequestQueryStringType;
  }>,
  reply: FastifyReply<{ Reply: getServersReplyBodyType }>,
): Promise<void> => {
  const { include_virtual_machines } = req.query;

  if (!include_virtual_machines) {
    const servers = await db
      .selectFrom("servers")
      .select(["publicId", "name"])
      .orderBy("publicId", "asc")
      .execute();

    return reply.status(200).send({ servers: servers });
  }

  const servs = await db
    .selectFrom("servers")
    .select(["publicId", "name"])
    .orderBy("publicId", "asc")
    .execute();

  if (servs.length === 0) {
    return reply.status(200).send({ servers: [] });
  }

  const serversWithVMs = await db
    .selectFrom("servers")
    .innerJoin("virtual_machines", "servers.id", "virtual_machines.serverId")
    .select([
      "servers.publicId as serverPublicId",
      "servers.name as serverName",
      "virtual_machines.publicId as vmPublicId",
      "virtual_machines.name as vmName",
      "virtual_machines.status as vmStatus",
    ])
    .orderBy("virtual_machines.publicId", "asc")
    .execute();

  const serversMap: getServersReplyBodyType = {
    servers: [],
  };

  servs.forEach((server) => {
    serversMap.servers.push({
      publicId: server.publicId,
      name: server.name,
      virtual_machines: [],
    });
  });

  serversWithVMs.forEach((row) => {
    let server = serversMap.servers.find(
      (s) => s.publicId === row.serverPublicId,
    );
    if (!server) {
      server = {
        publicId: row.serverPublicId,
        name: row.serverName,
        virtual_machines: [],
      };
      serversMap.servers.push(server);
    }
    server.virtual_machines?.push({
      publicId: row.vmPublicId,
      name: row.vmName,
      status: row.vmStatus,
    });
  });

  const servers = Object.values(serversMap.servers);

  return reply.status(200).send({ servers });
};

/* -------------------------------------------------------------------------- */
/*                               Get One Server                               */
/* -------------------------------------------------------------------------- */
export const getOneServer = async (
  req: FastifyRequest<{ Params: getOneServerParamsSchemaType }>,
  reply: FastifyReply<{ Reply: getOneServerReplyBodyType | NotFoundErrorType }>,
): Promise<void> => {
  const { publicId } = req.params;
  const server = await db
    .selectFrom("servers")
    .selectAll()
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  return reply.status(200).send({
    ...server,
  });
};

/* -------------------------------------------------------------------------- */
/*                             Get One Server VMs                             */
/* -------------------------------------------------------------------------- */
export const getVMsOfServer = async (
  req: FastifyRequest<{ Params: getVMsOfServerParamsSchemaType }>,
  reply: FastifyReply<{
    Reply: getVMsOfServerReplyBodyType | NotFoundErrorType;
  }>,
): Promise<void> => {
  const { publicId } = req.params;

  const server = await db
    .selectFrom("servers")
    .select(["id"])
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  const vms = await db
    .selectFrom("virtual_machines")
    .select([
      "publicId",
      "name",
      "status",
      "vcpus",
      "ram",
      "disk",
      "ipLocal",
      "ipPublic",
    ])
    .where("serverId", "=", server.id)
    .orderBy("publicId", "asc")
    .execute();

  return reply.status(200).send({ vms: vms });
};

/* -------------------------------------------------------------------------- */
/*                                  Try Info                                  */
/* -------------------------------------------------------------------------- */
export const tryInfo = async (
  req: FastifyRequest<{ Body: tryInfoRequestBodyType }>,
  reply: FastifyReply<{ Reply: tryInfoReplyBodyType | NotFoundErrorType }>,
): Promise<void> => {
  const { server_endpoint } = req.body;
  if (env.IGNORE_AGENT) {
    await new Promise((r) => setTimeout(r, 1780));

    return reply.status(200).send({
      message: "Test mode: Skipping server reachability check",
      info: {
        cpus: 4,
        vcpus: 8,
        memory_mb: 8192,
        disk: 100000,
        network: {
          prefix: "AB:CD:EF:12:34:56",
          gateway: "192.168.50.1",
          network: "192.168.50.0",
        },
      },
    });
  }
  const res = await fetch(`http://${server_endpoint}/api/v1/info`).catch(
    () => null,
  );

  if (!res || !res.ok) {
    return reply.status(404).send({ message: "Could not reach server" });
  }

  req.log.info(`Successfully reached server at ${server_endpoint}`);
  req.log.info(`Response status: ${res.status}`);
  // Parse Text to JSON
  const data = (await res.json()) as tryInfoType;
  const vm_network = data.network["br-vms"];
  if (vm_network) {
    req.log.info(`vm info: ${JSON.stringify(vm_network)}`);
  }

  const vmIpData = vm_network?.addresses.find((addr) => addr.family === "inet");
  if (vmIpData) {
    req.log.info(`VM IP: ${vmIpData.ip}, Prefix Length: ${vmIpData.prefixlen}`);
  }

  return reply.status(200).send({
    message: "Successfully reached server endpoint",
    info: {
      cpus: data.cpu.physical_cores,
      vcpus: data.cpu.logical_cpus,
      memory_mb: data.memory.total_bytes / 1024 / 1024,
      disk: data.disk_summary.root.total_bytes / 1024 / 1024,
      network: {
        prefix: vmIpData?.prefixlen
          ? cidrToNetmask(vmIpData?.prefixlen)
          : "0.0.0.0",
        gateway: vmIpData?.ip,
        network: calculateNetworkAddress(
          vmIpData?.ip || "",
          vmIpData?.prefixlen ? cidrToNetmask(vmIpData.prefixlen) : "",
        ),
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                                Create Server                               */
/* -------------------------------------------------------------------------- */
export const createServer = async (
  req: FastifyRequest<{ Body: createServerRequestBodyType }>,
  reply: FastifyReply<{ Reply: createServerReplyBodyType }>,
): Promise<void> => {
  // In production, check if server is reachable
  if (env.IGNORE_AGENT === false) {
    const checkIfServerIsReachable = await fetch(
      `http://${req.body.server_endpoint}/api/v1/health`,
    ).catch(() => null);

    if (
      !checkIfServerIsReachable?.ok ||
      checkIfServerIsReachable.status !== 200
    ) {
      return reply.status(400).send({ message: "Server is not reachable" });
    }
  } else {
    await new Promise((r) => setTimeout(r, 50));
  }

  const checkPublicId = await db
    .selectFrom("servers")
    .select("publicId")
    .where("publicId", "=", req.body.publicId)
    .executeTakeFirst();

  if (checkPublicId) {
    return reply
      .status(400)
      .send({ message: "Server with this publicId already exists" });
  }

  const server_endpoint_parts = req.body.server_endpoint.split(":");
  const agent_port = server_endpoint_parts[1] || "80";

  const insertedServer = await db
    .insertInto("servers")
    .values({
      publicId: req.body.publicId,
      name: req.body.name,
      ipLocal: server_endpoint_parts[0] || req.body.server_endpoint,
      cpus: req.body.cpus,
      vcpus: req.body.vcpus,
      ram: req.body.memory_mb,
      disk: req.body.disk,
      in_link: req.body.in_link_mbps,
      out_link: req.body.out_link_mbps,
      // Maximum to be used by VMs
      vcpus_max: req.body.vcpus_max,
      ram_max: req.body.memory_mb_max,
      disk_max: req.body.disk_max,
      // Starting available is the maximum
      vcpus_available: req.body.vcpus_max,
      ram_available: req.body.memory_mb_max,
      disk_available: req.body.disk_max,
      agent_port: agent_port ? parseInt(agent_port, 10) : 5000, // Default agent port
      // Network
      vms_network: req.body.vms_network,
      vms_network_mask: req.body.vms_network_mask,
      vms_gateway: req.body.vms_network_gateway,
    })
    .execute()
    .catch((error) => {
      req.log.error("Error inserting server into database:", error);
      return reply.status(500).send({ message: "Database error" });
    });

  return reply.status(200).send({
    message: "Server created successfully",
  });
};

export const healthCheckServer = async (
  req: FastifyRequest<{
    Params: healthCheckParamsSchemaType;
  }>,
  reply: FastifyReply<{
    Reply: healthCheckReplyBodyType | NotFoundErrorType | UnauthorizedErrorType;
  }>,
) => {
  const { publicId } = req.params;

  const server = await db
    .selectFrom("servers")
    .select(["ipLocal", "agent_port"])
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  if (env.IGNORE_AGENT) {
    await new Promise((r) => setTimeout(r, 1780));

    return reply.status(200).send({
      alive: true,
    });
  }

  const res = await fetch(
    `http://${server.ipLocal}:${server.agent_port}/api/v1/health`,
  ).catch(() => null);

  if (!res || !res.ok) {
    return reply.status(200).send({ alive: false });
  }

  return reply.status(200).send({ alive: true });
};

/* -------------------------------------------------------------------------- */
/*                                Update Server                               */
/* -------------------------------------------------------------------------- */
export const updateServer = async (
  req: FastifyRequest<{
    Params: updateServerParamsSchemaType;
    Body: updateServerRequestBodyType;
  }>,
  reply: FastifyReply<{
    Reply:
      | updateServerReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>,
) => {
  const { publicId } = req.params;

  const server = await db
    .selectFrom("servers")
    .select([
      "id",
      "vcpus_max",
      "ram_max",
      "disk_max",
      "vcpus_available",
      "ram_available",
      "disk_available",
    ])
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  const usedData = await db
    .selectFrom("virtual_machines")
    .select([
      (eb) => eb.fn.sum("vcpus").as("vcpus_used"),
      (eb) => eb.fn.sum("ram").as("ram_used"),
      (eb) => eb.fn.sum("disk").as("disk_used"),
    ])
    .where("serverId", "=", server.id)
    .executeTakeFirst();

  const vcpus_used = Number(usedData?.vcpus_used) || 0;
  const ram_used = Number(usedData?.ram_used) || 0;
  const disk_used = Number(usedData?.disk_used) || 0;

  if (
    Number(req.body.vcpus_max) < vcpus_used ||
    Number(req.body.memory_mb_max) < ram_used ||
    Number(req.body.disk_max) < disk_used
  ) {
    return reply.status(400).send({
      message:
        "New maximum resources cannot be less than currently used resources by VMs",
    });
  }

  const new_vcpus_available = Number(req.body.vcpus_max) - vcpus_used;
  const new_ram_available = Number(req.body.memory_mb_max) - ram_used;
  const new_disk_available = Number(req.body.disk_max) - disk_used;

  await db
    .updateTable("servers")
    .set({
      name: req.body.name,
      cpus: req.body.cpus,
      vcpus: req.body.vcpus,
      ram: req.body.memory_mb,
      disk: req.body.disk,
      in_link: req.body.in_link_mbps,
      out_link: req.body.out_link_mbps,
      vcpus_max: req.body.vcpus_max,
      ram_max: req.body.memory_mb_max,
      disk_max: req.body.disk_max,
      vcpus_available: new_vcpus_available,
      ram_available: new_ram_available,
      disk_available: new_disk_available,
    })
    .where("id", "=", server.id)
    .execute();

  return reply.status(200).send({ message: "Server updated successfully" });
};

/* -------------------------------------------------------------------------- */
/*                                Delete Server                               */
/* -------------------------------------------------------------------------- */
export const deleteServer = async (
  req: FastifyRequest<{ Params: deleteServerParamsSchemaType }>,
  reply: FastifyReply<{
    Reply:
      | deleteServerReplyBodyType
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>,
) => {
  const { publicId } = req.params;

  const server = await db
    .selectFrom("servers")
    .select(["id"])
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  Promise.all([
    db
      .deleteFrom("virtual_machines")
      .where("serverId", "=", server.id)
      .execute(),
  ]).catch((error) => {
    req.log.error("Error deleting related data for server:", error);
    return reply
      .status(500)
      .send({ message: "Database error during deletion" });
  });

  await db
    .deleteFrom("virtual_machines")
    .where("serverId", "=", server.id)
    .execute();

  await db.deleteFrom("servers").where("id", "=", server.id).execute();

  return reply.status(200).send({ message: "Server deleted successfully" });
};
