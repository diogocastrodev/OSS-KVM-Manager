import db from "@/db/database";
import type {
  GetAllSubusersResponse,
  SubUserParams,
} from "@/router/v1/virtual_machines/subuser/subuser.schema";
import type {
  ForbiddenErrorType,
  NotFoundErrorType,
} from "@/types/errorSchema";
import type { FastifyReply, FastifyRequest } from "fastify";

export const GetAllSubusers = async (
  req: FastifyRequest<{
    Params: SubUserParams;
  }>,
  reply: FastifyReply<{
    Reply: GetAllSubusersResponse | NotFoundErrorType | ForbiddenErrorType;
  }>,
) => {
  const { vmPublicId } = req.params;
  const vm = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.code(404).send({ message: "Virtual machine not found." });
  }

  const a = await db
    .selectFrom("virtual_machines_users as vmsu")
    .innerJoin("virtual_machines as vm", "vmsu.virtualMachinesId", "vm.id")
    .innerJoin("users as u", "vmsu.userId", "u.id")
    .select([
      "vmsu.id as subUserId",
      "u.name as subUserName",
      "u.email as subUserEmail",
      "vmsu.role as subUserRole",
    ])
    .where("vm.publicId", "=", vmPublicId)
    .orderBy("u.createdAt", "asc")
    .execute();

  if (a.length === 0) {
    return reply.code(404).send({
      message: "No sub-users found for this virtual machine.",
    });
  }

  return reply.code(200).send(a);
};
