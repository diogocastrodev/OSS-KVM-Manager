import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  createServerReplyBodyType,
  createServerRequestBodyType,
  getMyServersParamsSchemaType,
  getMyServersReplyBodyType,
  getOneServerParamsSchemaType,
  getOneServerReplyBodyType,
  getServersReplyBodyType,
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
  req: FastifyRequest,
  reply: FastifyReply<{ Reply: getServersReplyBodyType }>
): Promise<void> => {
  const servers = await db
    .selectFrom("servers")
    .select(["publicId", "name"])
    .execute();

  return reply.status(200).send({ servers: servers });
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
/*                               Get My Servers                               */
/* -------------------------------------------------------------------------- */
export const getMyServers = async (
  req: FastifyRequest<{
    Querystring: getMyServersParamsSchemaType;
  }>,
  reply: FastifyReply<{ Reply: getMyServersReplyBodyType }>
): Promise<void> => {
  let includeVMs = false;
  if (req.query?.include_virtual_machines.toLowerCase() === "true") {
    includeVMs = true;
  }

  console.log("Include VMs:", includeVMs);

  const user = await db
    .selectFrom("users")
    .select(["id", "role"])
    .where("email", "=", req.user.email)
    .executeTakeFirst();

  if (!user) {
    return reply.status(401).send({ servers: [] });
  }
  if (user.role === "ADMIN") {
    if (!includeVMs) {
      const servers = await db
        .selectFrom("servers")
        .select(["publicId", "name"])
        .execute();

      return reply.status(200).send({ servers: servers });
    }

    const serversWithVMs = await db
      .selectFrom("servers")
      .leftJoin("virtual_machines", "servers.id", "virtual_machines.serverId")
      .select([
        "servers.publicId as serverPublicId",
        "servers.name as serverName",
        "virtual_machines.publicId as vmPublicId",
        "virtual_machines.name as vmName",
      ])
      .execute();

    const serversMap: getMyServersReplyBodyType = {
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
      if (row.vmPublicId && row.vmName) {
        server.virtual_machines?.push({
          publicId: row.vmPublicId,
          name: row.vmName,
          status: "unknown",
        });
      }
    });

    const servers = Object.values(serversMap.servers);

    return reply.status(200).send({ servers });
  }
  if (!includeVMs) {
    const servers = await db
      .selectFrom("servers")
      .innerJoin("virtual_machines", "servers.id", "virtual_machines.serverId")
      .innerJoin(
        "virtual_machines_users",
        "virtual_machines.id",
        "virtual_machines_users.virtualMachinesId"
      )
      .where("virtual_machines_users.userId", "=", user.id)
      .select(["servers.publicId", "servers.name"])
      .execute();

    return reply.status(200).send({ servers: servers });
  }

  const serversWithVMs = await db
    .selectFrom("servers")
    .innerJoin("virtual_machines", "servers.id", "virtual_machines.serverId")
    .innerJoin(
      "virtual_machines_users",
      "virtual_machines.id",
      "virtual_machines_users.virtualMachinesId"
    )
    .where("virtual_machines_users.userId", "=", user.id)
    .select([
      "servers.publicId as serverPublicId",
      "servers.name as serverName",
      "virtual_machines.publicId as vmPublicId",
      "virtual_machines.name as vmName",
    ])
    .execute();

  const serversMap: getMyServersReplyBodyType = {
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
      status: "unknown",
    });
  });

  const servers = Object.values(serversMap.servers);

  return reply.status(200).send({ servers });
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

  const insertedServer = await db
    .insertInto("servers")
    .values({
      publicId: req.body.publicId,
      name: req.body.name,
      ipLocal: req.body.server_endpoint,
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
    })
    .execute();

  return reply.status(200).send({
    message: "Server created successfully",
  });
};
