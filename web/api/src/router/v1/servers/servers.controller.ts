import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  getMyServersParamsSchemaType,
  getMyServersReplyBodyType,
} from "./servers.schema";
import db from "@/db/database";
import type { NotFoundErrorType } from "@/types/errorSchema";
import type { tryInfoType } from "@/types/tryInfoType";

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
      "virtual_machines.status as vmStatus",
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
      status: row.vmStatus,
    });
  });

  const servers = Object.values(serversMap.servers);

  return reply.status(200).send({ servers });
};
