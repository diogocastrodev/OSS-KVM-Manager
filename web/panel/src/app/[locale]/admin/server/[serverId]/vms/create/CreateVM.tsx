"use client";

import { AdminServersResponse } from "@/app/[locale]/admin/layout";
import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import { ServerData } from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import netmaskToCidr from "@/utils/netmaskToCIDR";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import z from "zod";

interface props {
  serverId: string;
}

export default function CreateVM({ serverId }: props) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.admin.servers.getById(parseInt(serverId))],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/servers/${serverId}`);
      if (!d.ok) {
      }
      return d.json() as Promise<ServerData>;
    },
  });

  const { refetch: updateLayout } = useQuery({
    queryKey: qk.api.v1.admin.servers.all(),
    queryFn: async () =>
      await apiFetch(
        "/api/v1/admin/servers?include_virtual_machines=true",
      ).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch servers");
        }
        return res.json() as Promise<AdminServersResponse>;
      }),
  });

  const createVMMutation = useMutation({
    mutationKey: [qk.api.v1.admin.servers.create()],
    mutationFn: async (data: {
      publicId: number;
      name: string;
      vcpus: number;
      memory_mib: number;
      disk_gb: number;
      network: {
        in_avg_mbps: number;
        in_peak_mbps: number;
        in_burst_mbps: number;
        out_avg_mbps: number;
        out_peak_mbps: number;
        out_burst_mbps: number;
      };
      ip_local: string;
    }) => {
      const d = await apiFetch(`/api/v1/admin/vms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverPublicId: parseInt(serverId),
          ...data,
        }),
      });
      if (!d.ok) {
        toast.error("Failed to create VM. Please try again.");
        throw new Error("Failed to create VM");
      }
      updateLayout();
      toast.success("VM created successfully!");
      const createdVM = (await d.json()) as { publicId: number; name: string };
      router.push(`/admin/vm/${createdVM.publicId}`);
      return createdVM;
    },
  });

  const createVMValidator = z.object({
    publicId: z.string(),
    name: z.string(),
    vcpus: z.string(),
    memory_mib: z.string(),
    disk_gb: z.string(),
    network_in_avg_mbps: z.string(),
    network_in_peak_mbps: z.string(),
    network_in_burst_mbps: z.string(),
    network_out_avg_mbps: z.string(),
    network_out_peak_mbps: z.string(),
    network_out_burst_mbps: z.string(),
    ip_local: z.string(),
  });

  const createVMForm = useAppForm({
    defaultValues: {
      publicId: "0",
      name: "",
      vcpus: "1",
      memory_mib: "512",
      disk_gb: "5",
      network_in_avg_mbps: "0",
      network_in_peak_mbps: "0",
      network_in_burst_mbps: "0",
      network_out_avg_mbps: "0",
      network_out_peak_mbps: "0",
      network_out_burst_mbps: "0",
      ip_local: "",
    },
    validators: {
      onSubmit: createVMValidator,
    },
    onSubmit: async ({ value }) => {
      createVMMutation.mutate({
        publicId: Number(value.publicId),
        name: value.name,
        vcpus: Number(value.vcpus),
        memory_mib: Number(value.memory_mib),
        disk_gb: Number(value.disk_gb),
        network: {
          in_avg_mbps: Number(value.network_in_avg_mbps),
          in_peak_mbps: Number(value.network_in_peak_mbps),
          in_burst_mbps: Number(value.network_in_burst_mbps),
          out_avg_mbps: Number(value.network_out_avg_mbps),
          out_peak_mbps: Number(value.network_out_peak_mbps),
          out_burst_mbps: Number(value.network_out_burst_mbps),
        },
        ip_local: value.ip_local,
      });
    },
  });
  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="text-2xl">Create a new virtual machine</div>
        <div className="flex flex-col gap-y-3">
          <div className="text-xl">Server Information:</div>
          <div className="flex flex-col gap-y-1">
            <span>vCPU available: {data?.vcpus_available}</span>
            <span>RAM available: {data?.ram_available} MB</span>
            <span>Disk available: {data?.disk_available} GB</span>
            <span>Network In Link: {data?.in_link} Mbps</span>
            <span>Network Out Link: {data?.out_link} Mbps</span>
            {data?.vms_network && (
              <span>
                Machine Network for VMs:
                <span className="pl-1">
                  {data?.vms_network}/
                  {data &&
                    data.vms_network_mask &&
                    netmaskToCidr(data.vms_network_mask)}
                </span>
              </span>
            )}
            {data?.vms_gateway && (
              <span>
                Machine Gateway for VMs:
                <span className="pl-1">{data?.vms_gateway}</span>
              </span>
            )}
          </div>
        </div>
        <Divider />
        <createVMForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <div className="text-xl">General Information:</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText="Name:"
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText="Public ID:"
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">Resource Allocation:</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="vcpus">
                {(field) => (
                  <field.InputField
                    inputId="vcpus"
                    inputName="vcpus"
                    inputType="number"
                    labelText="vCPUs:"
                    inputProps={{
                      min: 1,
                      max: data ? data.vcpus_available : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="memory_mib">
                {(field) => (
                  <field.InputField
                    inputId="memory_mib"
                    inputName="memory_mib"
                    inputType="number"
                    labelText="Memory (MB):"
                    inputProps={{
                      min: 512,
                      max: data ? data.ram_available : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="disk_gb">
                {(field) => (
                  <field.InputField
                    inputId="disk_gb"
                    inputName="disk_gb"
                    inputType="number"
                    labelText="Disk (GB):"
                    inputProps={{
                      min: 1,
                      max: data ? data.disk_available : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">Network Configuration:</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="ip_local">
                {(field) => (
                  <field.InputField
                    inputId="ip_local"
                    inputName="ip_local"
                    inputType="text"
                    labelText="Local IP:"
                  />
                )}
              </createVMForm.AppField>
            </div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="network_in_avg_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_avg_mbps"
                    inputName="network_in_avg_mbps"
                    inputType="number"
                    labelText="Network In Avg (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.in_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="network_in_peak_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_peak_mbps"
                    inputName="network_in_peak_mbps"
                    inputType="number"
                    labelText="Network In Peak (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.in_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="network_in_burst_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_burst_mbps"
                    inputName="network_in_burst_mbps"
                    inputType="number"
                    labelText="Network In Burst (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.in_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="network_out_avg_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_avg_mbps"
                    inputName="network_out_avg_mbps"
                    inputType="number"
                    labelText="Network Out Avg (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.out_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="network_out_peak_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_peak_mbps"
                    inputName="network_out_peak_mbps"
                    inputType="number"
                    labelText="Network Out Peak (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.out_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="network_out_burst_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_burst_mbps"
                    inputName="network_out_burst_mbps"
                    inputType="number"
                    labelText="Network Out Burst (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data ? data.out_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <Button text="Create VM" />
          </div>
        </createVMForm.AppForm>
        <div className="my-4"></div>
      </div>
    </>
  );
}
