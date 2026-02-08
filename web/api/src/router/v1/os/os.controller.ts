import db from "@/db/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetOSAvailableResponseType } from "./os.schema";

export const getAllOS = async (
  req: FastifyRequest,
  reply: FastifyReply<{
    Reply: GetOSAvailableResponseType;
  }>,
) => {
  const a = await db
    .selectFrom("operative_systems")
    .innerJoin("isos_paths", "operative_systems.id", "isos_paths.osId")
    .select([
      "operative_systems.id",
      "operative_systems.os",
      "operative_systems.version",
      "isos_paths.status as isoStatus",
      "isos_paths.arch as isoArch",
    ])
    .where("isos_paths.status", "=", "ACTIVE")
    .execute();

  const v: GetOSAvailableResponseType = [];

  for (const os of a) {
    const index = v.findIndex(
      (o) => o.os.toLowerCase() === os.os.toLowerCase(),
    );
    if (index === -1) {
      v.push({
        os: os.os,
        versions: [
          {
            version: os.version,
            arch: os.isoArch,
            status: os.isoStatus,
            id: os.id,
          },
        ],
      });
    } else {
      if (v[index])
        v[index].versions.push({
          version: os.version,
          arch: os.isoArch,
          status: os.isoStatus,
          id: os.id,
        });
      else {
        v.push({
          os: os.os,
          versions: [
            {
              version: os.version,
              arch: os.isoArch,
              status: os.isoStatus,
              id: os.id,
            },
          ],
        });
      }
    }
  }

  return reply.code(200).send(v);
};
