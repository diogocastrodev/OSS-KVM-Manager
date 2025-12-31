import type { FastifyReply, FastifyRequest } from "fastify";
import type {
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
  const { serverId } = req.params;
  const server = await db
    .selectFrom("servers")
    .select(["publicId", "name"])
    .where("publicId", "=", serverId)
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

  return reply
    .status(200)
    .send({ message: "Successfully reached server endpoint" });
};
