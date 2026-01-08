import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  AdminCreateVirtualMachineBody,
  AdminCreateVirtualMachineReply,
} from "./vm.schema";
import db from "@/db/database";
import {
  NotFoundError,
  type NotFoundErrorType,
  type UnauthorizedErrorType,
} from "@/types/errorSchema";
import genMac from "@/utils/genMac";
import type { CreateVMBody, PreparedRequest } from "@/utils/agentRoutes";
import type { AgentRoutes } from "@/utils/agentRoutes";

export const adminGetAllVirtualMachines = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};

export const adminGetVirtualMachineById = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};

export const adminCreateVirtualMachine = async (
  req: FastifyRequest<{
    Body: AdminCreateVirtualMachineBody;
  }>,
  reply: FastifyReply<{
    Reply: AdminCreateVirtualMachineReply | NotFoundErrorType;
  }>
) => {
  const server = await db
    .selectFrom("servers")
    .select([
      "ram_available",
      "disk_available",
      "vcpus_available",
      "id",
      "ipLocal",
      "agent_port",
      "vms_mac_prefix",
    ])
    .where("publicId", "=", req.body.serverPublicId)
    .executeTakeFirst();

  if (!server) {
    return reply.status(404).send({ message: "Server not found" });
  }

  // Check for available resources
  if (
    server.ram_available < req.body.memory_mib ||
    server.disk_available < req.body.disk_gb ||
    server.vcpus_available < req.body.vcpus
  ) {
    return reply.status(400).send({ message: "Insufficient server resources" });
  }

  const existingVM = await db
    .selectFrom("virtual_machines")
    .select(["id"])
    .where("publicId", "=", req.body.publicId)
    .executeTakeFirst();

  if (existingVM) {
    return reply
      .status(400)
      .send({ message: "Virtual machine ID already in use" });
  }
  let vmMac = "";
  try {
    if (server.vms_mac_prefix) {
      const a = server.vms_mac_prefix.split(":").length;
      const pre1 = server.vms_mac_prefix.split(":")[0];
      const pre2 = server.vms_mac_prefix.split(":")[1] || undefined;
      const pre3 = server.vms_mac_prefix.split(":")[2] || undefined;
      if (a < 1 || a > 3) {
        return reply
          .status(500)
          .send({ message: "Invalid MAC prefix configuration on server" });
      }

      if (pre1 === "00" || pre1 === "ff") {
        return reply
          .status(500)
          .send({ message: "Invalid MAC prefix configuration on server" });
      }

      if (!pre1) {
        return reply
          .status(500)
          .send({ message: "Invalid MAC prefix configuration on server" });
      }
      vmMac = genMac({
        prefixs: {
          pre1: pre1,
          pre2: pre2,
          pre3: pre3,
        },
      });
    } else {
      vmMac = genMac({
        prefixs: {
          pre1: "52",
        },
      });
    }
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Failed to generate MAC address for VM" });
  }

  const newVM = await db
    .insertInto("virtual_machines")
    .values({
      publicId: req.body.publicId,
      name: req.body.name,
      vcpus: req.body.vcpus,
      ram: req.body.memory_mib,
      disk: req.body.disk_gb,
      serverId: server.id,
      ipLocal: req.body.ip_local,
      ipPublic: req.body.ip_public || null,
      in_avg: req.body.network.in_avg_mbps,
      in_peak: req.body.network.in_peak_mbps,
      in_burst: req.body.network.in_burst_mbps,
      out_avg: req.body.network.out_avg_mbps,
      out_peak: req.body.network.out_peak_mbps,
      out_burst: req.body.network.out_burst_mbps,
      mac: vmMac,
    })
    .returning(["publicId", "name", "id"])
    .executeTakeFirst();

  if (!newVM) {
    return reply
      .status(500)
      .send({ message: "Failed to create virtual machine" });
  }

  const hostProvided = req.body.host && {
    hostname: req.body.host.hostname,
    username: req.body.host.username,
    password: req.body.host.password,
    public_key: req.body.host.public_key,
  };

  const prepareRoute: PreparedRequest<AgentRoutes["createVM"]> = {
    method: "POST",
    path: "/api/v1/vms",
    body: {
      vm_id: newVM.id,
      ...hostProvided,
      vm: {
        vcpus: req.body.vcpus,
        memory: req.body.memory_mib,
        disk_size: req.body.disk_gb,
        network: req.body.network,
        ip_local: req.body.ip_local,
        mac: vmMac,
      },
      os_path: req.body.os || "", // Which OS image to use
    },
  };

  try {
    const createVM = await fetch(
      `${server.ipLocal}:${server.agent_port}${prepareRoute.path}`,
      {
        method: prepareRoute.method,
        body: JSON.stringify(prepareRoute.body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!createVM.ok) {
      // Rollback DB insert
      await db
        .deleteFrom("virtual_machines")
        .where("id", "=", newVM.id)
        .execute();

      return reply
        .status(500)
        .send({ message: "Failed to create virtual machine on agent" });
    }

    return reply.status(201).send({
      publicId: newVM.publicId,
      name: newVM.name,
    });
  } catch (error) {}
};

export const adminUpdateVirtualMachine = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};

export const adminDeleteVirtualMachine = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};
