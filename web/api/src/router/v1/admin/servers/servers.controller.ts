import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  createServerReplyBodyType,
  createServerRequestBodyType,
  getOneServerParamsSchemaType,
  getOneServerReplyBodyType,
  getServersReplyBodyType,
  getServersRequestQueryStringType,
  tryInfoReplyBodyType,
  tryInfoRequestBodyType,
} from "./servers.schema";
import db from "@/db/database";
import type { NotFoundErrorType } from "@/types/errorSchema";
import type { tryInfoType } from "@/types/tryInfoType";

/* -------------------------------------------------------------------------- */
/*                               Get All Servers                              */
/* -------------------------------------------------------------------------- */
export const getAllServers = async (
  req: FastifyRequest<{
    Querystring: getServersRequestQueryStringType;
  }>,
  reply: FastifyReply<{ Reply: getServersReplyBodyType }>
): Promise<void> => {
  const { include_virtual_machines } = req.query;

  if (!include_virtual_machines) {
    const servers = await db
      .selectFrom("servers")
      .select(["publicId", "name"])
      .execute();

    return reply.status(200).send({ servers: servers });
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
    .execute();

  const serversMap: getServersReplyBodyType = {
    servers: [],
  };

  serversWithVMs.forEach((row) => {
    let server = serversMap.servers.find(
      (s) => s.publicId === row.serverPublicId
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
  reply: FastifyReply<{ Reply: getOneServerReplyBodyType | NotFoundErrorType }>
): Promise<void> => {
  const { publicId } = req.params;
  const server = await db
    .selectFrom("servers")
    .select(["publicId", "name"])
    .where("publicId", "=", publicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server Not Found" });
  }

  return reply.status(200).send({ server: server });
};

/* -------------------------------------------------------------------------- */
/*                                  Try Info                                  */
/* -------------------------------------------------------------------------- */
export const tryInfo = async (
  req: FastifyRequest<{ Body: tryInfoRequestBodyType }>,
  reply: FastifyReply<{ Reply: tryInfoReplyBodyType | NotFoundErrorType }>
): Promise<void> => {
  const { server_endpoint } = req.body;

  const res = await fetch(`http://${server_endpoint}/api/v1/info`).catch(
    () => null
  );

  if (!res || !res.ok) {
    return reply.status(404).send({ message: "Could not reach server" });
  }

  req.log.info(`Successfully reached server at ${server_endpoint}`);
  req.log.info(`Response status: ${res.status}`);
  // Parse Text to JSON
  const data = (await res.json()) as tryInfoType;

  return reply.status(200).send({
    message: "Successfully reached server endpoint",
    info: {
      cpus: data.cpu.physical_cores,
      vcpus: data.cpu.logical_cpus,
      memory_mb: data.memory.total_bytes / 1024 / 1024,
      disk: data.disk_summary.root.total_bytes / 1024 / 1024,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                                Create Server                               */
/* -------------------------------------------------------------------------- */
export const createServer = async (
  req: FastifyRequest<{ Body: createServerRequestBodyType }>,
  reply: FastifyReply<{ Reply: createServerReplyBodyType }>
): Promise<void> => {
  const checkIfServerIsReachable = await fetch(
    `http://${req.body.server_endpoint}/api/v1/health`
  ).catch(() => null);

  if (
    !checkIfServerIsReachable?.ok ||
    checkIfServerIsReachable.status !== 200
  ) {
    return reply.status(400).send({ message: "Server is not reachable" });
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
      agent_port: agent_port ? parseInt(agent_port, 10) : 80, // Default agent port
    })
    .execute();

  return reply.status(200).send({
    message: "Server created successfully",
  });
};
