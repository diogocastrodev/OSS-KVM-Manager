"use client";

import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import { ServerData } from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import netmaskToCidr from "@/utils/netmaskToCIDR";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import z from "zod";

interface props {
  vmId: string;
}

export default function VMsSettings({ vmId }: props) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.admin.vms.getById(parseInt(vmId))],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/vms/${vmId}?include_server=true`);
      if (!d.ok) {
        toast.error("Failed to fetch VM data. Please try again.");
        throw new Error("Failed to fetch VM data");
      }
      return d.json() as Promise<AdminGetVMByIDResponse>;
    },
  });
  console.log(data);

  useEffect(() => {
    if (data) {
      updateVMForm.setFieldValue("publicId", data.publicId.toString());
      updateVMForm.setFieldValue("name", data.name);
      updateVMForm.setFieldValue("vcpus", data.vcpus.toString());
      updateVMForm.setFieldValue("memory_mib", data.ram.toString());
      updateVMForm.setFieldValue("disk_gb", data.disk.toString());
      updateVMForm.setFieldValue("network_in_avg_mbps", data.in_avg.toString());
      updateVMForm.setFieldValue(
        "network_in_peak_mbps",
        data.in_peak.toString(),
      );
      updateVMForm.setFieldValue(
        "network_in_burst_mbps",
        data.in_burst.toString(),
      );
      updateVMForm.setFieldValue(
        "network_out_avg_mbps",
        data.out_avg.toString(),
      );
      updateVMForm.setFieldValue(
        "network_out_peak_mbps",
        data.out_peak.toString(),
      );
      updateVMForm.setFieldValue(
        "network_out_burst_mbps",
        data.out_burst.toString(),
      );
    }
  }, [data]);

  const updateVMMutation = useMutation({
    mutationKey: [qk.api.v1.admin.vms.update(parseInt(vmId))],
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
    }) => {
      const d = await apiFetch(`/api/v1/admin/vms/${vmId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverPublicId: parseInt(vmId),
          ...data,
        }),
      });
      if (!d.ok) {
        toast.error("Failed to update VM. Please try again.");
        throw new Error("Failed to update VM");
      }
      toast.success("VM updated successfully!");
      const updatedVM = (await d.json()) as { publicId: number; name: string };
      router.push(`/admin/vm/${updatedVM.publicId}`);
      return updatedVM;
    },
  });

  const updateVMValidator = z.object({
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
  });

  const updateVMForm = useAppForm({
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
    },
    validators: {
      onSubmit: updateVMValidator,
    },
    onSubmit: async ({ value }) => {
      updateVMMutation.mutate({
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
      });
    },
  });
  console.log(data);
  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="text-2xl">Update virtual machine</div>

        <div className="flex flex-col gap-y-3">
          <div className="text-xl">Server Information:</div>
          <div className="flex flex-col gap-y-1">
            <span>
              vCPU available: {data?.include_server.serversVcpusAvailable}
            </span>
            <span>
              RAM available: {data?.include_server.serversRamAvailable} MB
            </span>
            <span>
              Disk available: {data?.include_server.serversDiskAvailable} GB
            </span>
            <span>
              Network In Link: {data?.include_server.serversInLinkSpeedMbps}{" "}
              Mbps
            </span>
            <span>
              Network Out Link: {data?.include_server.serversOutLinkSpeedMbps}{" "}
              Mbps
            </span>
          </div>
        </div>
        <Divider />
        <updateVMForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <div className="text-xl">General Information:</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText="Name:"
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText="Public ID:"
                  />
                )}
              </updateVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">Resource Allocation:</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="vcpus">
                {(field) => (
                  <field.InputField
                    inputId="vcpus"
                    inputName="vcpus"
                    inputType="number"
                    labelText="vCPUs:"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversVcpusAvailable
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="memory_mib">
                {(field) => (
                  <field.InputField
                    inputId="memory_mib"
                    inputName="memory_mib"
                    inputType="number"
                    labelText="Memory (MB):"
                    inputProps={{
                      min: 512,
                      max: data
                        ? data.include_server.serversRamAvailable
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="disk_gb">
                {(field) => (
                  <field.InputField
                    inputId="disk_gb"
                    inputName="disk_gb"
                    inputType="number"
                    labelText="Disk (GB):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversDiskAvailable
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">Network Configuration:</div>
            {/* <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="ip_local">
                {(field) => (
                  <field.InputField
                    inputId="ip_local"
                    inputName="ip_local"
                    inputType="text"
                    labelText="Local IP:"
                  />
                )}
              </updateVMForm.AppField>
            </div> */}
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="network_in_avg_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_avg_mbps"
                    inputName="network_in_avg_mbps"
                    inputType="number"
                    labelText="Network In Avg (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversInLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="network_in_peak_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_peak_mbps"
                    inputName="network_in_peak_mbps"
                    inputType="number"
                    labelText="Network In Peak (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversInLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="network_in_burst_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_in_burst_mbps"
                    inputName="network_in_burst_mbps"
                    inputType="number"
                    labelText="Network In Burst (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversInLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
            </div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="network_out_avg_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_avg_mbps"
                    inputName="network_out_avg_mbps"
                    inputType="number"
                    labelText="Network Out Avg (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversOutLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="network_out_peak_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_peak_mbps"
                    inputName="network_out_peak_mbps"
                    inputType="number"
                    labelText="Network Out Peak (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversOutLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="network_out_burst_mbps">
                {(field) => (
                  <field.InputField
                    inputId="network_out_burst_mbps"
                    inputName="network_out_burst_mbps"
                    inputType="number"
                    labelText="Network Out Burst (Mbps):"
                    inputProps={{
                      min: 1,
                      max: data
                        ? data.include_server.serversOutLinkSpeedMbps
                        : undefined,
                    }}
                  />
                )}
              </updateVMForm.AppField>
            </div>
            <Divider />
            <Button text="Update VM" />
          </div>
        </updateVMForm.AppForm>
        <div className="my-4"></div>
      </div>
    </>
  );
}
