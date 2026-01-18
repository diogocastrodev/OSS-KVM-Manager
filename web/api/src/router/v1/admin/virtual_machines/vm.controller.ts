import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  AdminCreateVirtualMachineBody,
  AdminCreateVirtualMachineReply,
  AdminDeleteVirtualMachineParams,
  AdminDeleteVirtualMachineReply,
  AdminGetVirtualMachineByIdParams,
  AdminGetVirtualMachineByIdReply,
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
import { pollFinalizeUntilOperational } from "@/utils/pool";

export const adminGetAllVirtualMachines = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const vms = await db.selectFrom("virtual_machines").selectAll().execute();
  return { vms };
};

export const adminGetVirtualMachineById = async (
  req: FastifyRequest<{
    Params: AdminGetVirtualMachineByIdParams;
  }>,
  reply: FastifyReply<{
    Reply:
      | AdminGetVirtualMachineByIdReply
      | NotFoundErrorType
      | UnauthorizedErrorType;
  }>
) => {
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines")
    .selectAll()
    .where("publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({ message: "Virtual machine not found" });
  }

  return reply.status(200).send({
    publicId: vm.publicId,
    name: vm.name,
    status: vm.status,
    createdAt: vm.createdAt.toISOString(),
    updatedAt: vm.updatedAt.toISOString(),
  });
};

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
      "vms_gateway",
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
    console.log(error);
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

  const prepareRoute: PreparedRequest<AgentRoutes["createVM"]> = {
    method: "POST",
    path: "/api/v1/vms",
    body: {
      vm_id: newVM.id,
      vm: {
        vcpus: req.body.vcpus,
        memory: req.body.memory_mib,
        disk_size: req.body.disk_gb,
        network: req.body.network,
        mac: vmMac,
      },
    },
  };

  try {
    // AGENT FETCH
    const time_now = Date.now();
    const createVM = await fetch(
      `http://${server.ipLocal}:${server.agent_port}${prepareRoute.path}`,
      {
        method: prepareRoute.method,
        body: JSON.stringify(prepareRoute.body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const time_end = Date.now();
    console.log(`VM Create fetch took ${time_end - time_now} milliseconds`);

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

    // VM created on agent, update server resources
    await db
      .updateTable("servers")
      .set({
        ram_available: server.ram_available - req.body.memory_mib,
        disk_available: server.disk_available - req.body.disk_gb,
        vcpus_available: server.vcpus_available - req.body.vcpus,
      })
      .where("id", "=", server.id)
      .execute();

    if (req.body.os) {
      const os = await db
        .selectFrom("isos_paths")
        .selectAll()
        .where("path", "=", req.body.os)
        .executeTakeFirst();

      if (!os) {
        return reply.status(404).send({ message: "OS path not found" });
      }

      const hostProvided = req.body.host && {
        host: {
          hostname: req.body.host.hostname,
          username: req.body.host.username,
          password: req.body.host.password,
          public_key: req.body.host.public_key,
        },
      };

      // Send format request to agent
      const formatPrepareRoute: PreparedRequest<AgentRoutes["formatVM"]> = {
        method: "POST",
        path: `/api/v1/vms/:vm_id/format`,
        params: {
          vm_id: newVM.id,
        },
        body: {
          mode: hostProvided ? "cloud" : "iso",
          vm_id: newVM.id,
          ...hostProvided,
          network: {
            mac_address: vmMac,
            ip_cidr: req.body.ip_local,
            gateway: server.vms_gateway || "",
            dns_servers: req.body.dns_servers || [],
          },
          os: {
            os_name: os.path,
            // TODO: Use proper URL construction
            os_url: `http://100.78.85.5:8000/api/v1/agent/os/${os.path}/download`,
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
        .where("id", "=", newVM.id)
        .execute();

      const time_now = Date.now();
      // AGENT FETCH
      const formatVM = await fetch(
        `http://${server.ipLocal}:${server.agent_port}${formatPrepareRoute.path}`.replace(
          ":vm_id",
          newVM.id
        ),
        {
          method: formatPrepareRoute.method,
          body: JSON.stringify(formatPrepareRoute.body),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const time_end = Date.now();
      console.log(`VM Format fetch took ${time_end - time_now} milliseconds`);

      console.log("\n\n");
      console.log("Format VM response:", formatVM);
      console.log("\n\n");

      if (!formatVM.ok) {
        const deleteVMResponse = await fetch(
          `http://${server.ipLocal}:${server.agent_port}/api/v1/vms/${newVM.id}`,
          {
            method: "DELETE",
          }
        );

        // Rollback DB insert
        await db
          .deleteFrom("virtual_machines")
          .where("id", "=", newVM.id)
          .execute();

        if (deleteVMResponse.ok) {
          // Update server resources
          await db
            .updateTable("servers")
            .set({
              ram_available: server.ram_available + req.body.memory_mib,
              disk_available: server.disk_available + req.body.disk_gb,
              vcpus_available: server.vcpus_available + req.body.vcpus,
            })
            .where("id", "=", server.id)
            .execute();
        }

        return reply
          .status(500)
          .send({ message: "Failed to format virtual machine on agent" });
      }

      pollFinalizeUntilOperational(
        `http://${server.ipLocal}:${server.agent_port}`,
        newVM.id
      );

      return reply.status(202).send({
        message: "Virtual machine created, formatting in progress",
      });
    } else {
      // No OS install, set VM to OPERATIONAL directly
      await db
        .updateTable("virtual_machines")
        .set({
          status: "OPERATIONAL",
        })
        .where("id", "=", newVM.id)
        .execute();
    }

    return reply.status(201).send({
      publicId: newVM.publicId,
      name: newVM.name,
    });
  } catch (error) {
    console.log(error);
    // Rollback DB insert
    await db
      .deleteFrom("virtual_machines")
      .where("id", "=", newVM.id)
      .execute();

    return reply
      .status(500)
      .send({ message: "Failed to communicate with agent" });
  }
};

export const adminUpdateVirtualMachine = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {};

export const adminDeleteVirtualMachine = async (
  req: FastifyRequest<{
    Params: AdminDeleteVirtualMachineParams;
  }>,
  reply: FastifyReply<{
    Reply: AdminDeleteVirtualMachineReply | NotFoundErrorType;
  }>
) => {
  const { vmPublicId } = req.params;

  const vm = await db
    .selectFrom("virtual_machines as vm")
    .innerJoin("servers", "vm.serverId", "servers.id")
    .select([
      "vm.id as vmId",
      "vm.ram as vmRam",
      "vm.disk as vmDisk",
      "vm.vcpus as vmVcpus",
      "servers.id as serverId",
      "servers.ipLocal as serversIpLocal",
      "servers.agent_port as serversAgentPort",
      "servers.vcpus_available as serversVcpusAvailable",
      "servers.ram_available as serversRamAvailable",
      "servers.disk_available as serversDiskAvailable",
    ])
    .where("vm.publicId", "=", vmPublicId)
    .executeTakeFirst();

  if (!vm) {
    return reply.status(404).send({ message: "Virtual machine not found" });
  }

  // Send delete request to agent
  try {
    // AGENT FETCH
    const deleteVMResponse = await fetch(
      `http://${vm.serversIpLocal}:${vm.serversAgentPort}/api/v1/vms/${vm.vmId}`,
      {
        method: "DELETE",
      }
    );

    if (!deleteVMResponse.ok) {
      return reply
        .status(500)
        .send({ message: "Failed to delete virtual machine on agent" });
    }

    // Update server resources
    await db
      .updateTable("servers")
      .set({
        ram_available: vm.serversRamAvailable + vm.vmRam,
        disk_available: vm.serversDiskAvailable + vm.vmDisk,
        vcpus_available: vm.serversVcpusAvailable + vm.vmVcpus,
      })
      .where("id", "=", vm.serverId)
      .execute();

    // Delete VM from DB
    await db.deleteFrom("virtual_machines").where("id", "=", vm.vmId).execute();

    return reply
      .status(200)
      .send({ message: "Virtual machine deleted successfully" });
  } catch (error) {
    console.log(error);
    return reply
      .status(500)
      .send({ message: "Failed to communicate with agent" });
  }
};
