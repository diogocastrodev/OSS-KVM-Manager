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
  translations: {
    title: string;
    toast: {
      success: string;
      error: string;
    };
    server: {
      title: string;
      vcpuAvailable: string;
      memoryAvailable: string;
      diskAvailable: string;
      networkInLink: string;
      networkOutLink: string;
      machineNetworkVms: string;
      machineNetworkGateway: string;
    };
    general: {
      title: string;
      name: string;
      invalidName: string;
      placeholderName: string;
      publicId: string;
      invalidPublicId: string;
      placeholderPublicId: string;
    };
    resources: {
      title: string;
      vcpus: string;
      invalidVcpus: string;
      placeholderVcpus: string;
      memory: string;
      invalidMemory: string;
      placeholderMemory: string;
      disk: string;
      invalidDisk: string;
      placeholderDisk: string;
    };
    network: {
      title: string;
      localIp: string;
      invalidLocalIp: string;
      placeholderLocalIp: string;
      netInAvg: string;
      invalidNetInAvg: string;
      placeholderNetInAvg: string;
      netOutAvg: string;
      invalidNetOutAvg: string;
      placeholderNetOutAvg: string;
      netInPeak: string;
      invalidNetInPeak: string;
      placeholderNetInPeak: string;
      netOutPeak: string;
      invalidNetOutPeak: string;
      placeholderNetOutPeak: string;
      netInBurst: string;
      invalidNetInBurst: string;
      placeholderNetInBurst: string;
      netOutBurst: string;
      invalidNetOutBurst: string;
      placeholderNetOutBurst: string;
    };
    button: string;
  };
}

export default function CreateVM({ serverId, translations: t }: props) {
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
          console.error("Failed to fetch servers data");
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
        toast.error(t.toast.error);
        console.error("Failed to create VM", await d.text());
      }
      updateLayout();
      toast.success(t.toast.success);
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
        <div className="text-2xl">{t.title}</div>
        <div className="flex flex-col gap-y-3">
          <div className="text-xl">{t.server.title}</div>
          <div className="flex flex-col gap-y-1">
            <span>
              {t.server.vcpuAvailable}: {data?.vcpus_available}
            </span>
            <span>
              {t.server.memoryAvailable}: {data?.ram_available} MB
            </span>
            <span>
              {t.server.diskAvailable}: {data?.disk_available} GB
            </span>
            <span>
              {t.server.networkInLink}: {data?.in_link} Mbps
            </span>
            <span>
              {t.server.networkOutLink}: {data?.out_link} Mbps
            </span>
            {data?.vms_network && (
              <span>
                {t.server.machineNetworkVms}:
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
                {t.server.machineNetworkGateway}:
                <span className="pl-1">{data?.vms_gateway}</span>
              </span>
            )}
          </div>
        </div>
        <Divider />
        <createVMForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <div className="text-xl">{t.general.name}</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText={t.general.name}
                    placeholder={t.general.placeholderName}
                  />
                )}
              </createVMForm.AppField>
              <createVMForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText={t.general.publicId}
                    placeholder={t.general.placeholderPublicId}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">{t.resources.title}</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="vcpus">
                {(field) => (
                  <field.InputField
                    inputId="vcpus"
                    inputName="vcpus"
                    inputType="number"
                    labelText={t.resources.vcpus}
                    placeholder={t.resources.placeholderVcpus}
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
                    labelText={t.resources.memory}
                    placeholder={t.resources.placeholderMemory}
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
                    labelText={t.resources.disk}
                    placeholder={t.resources.placeholderDisk}
                    inputProps={{
                      min: 1,
                      max: data ? data.disk_available : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">{t.network.title}</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <createVMForm.AppField name="ip_local">
                {(field) => (
                  <field.InputField
                    inputId="ip_local"
                    inputName="ip_local"
                    inputType="text"
                    labelText={t.network.localIp}
                    placeholder={t.network.placeholderLocalIp}
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
                    labelText={t.network.netInAvg}
                    placeholder={t.network.placeholderNetInAvg}
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
                    labelText={t.network.netInPeak}
                    placeholder={t.network.placeholderNetInPeak}
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
                    labelText={t.network.netInBurst}
                    placeholder={t.network.placeholderNetInBurst}
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
                    labelText={t.network.netOutAvg}
                    placeholder={t.network.placeholderNetOutAvg}
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
                    labelText={t.network.netOutPeak}
                    placeholder={t.network.placeholderNetOutPeak}
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
                    labelText={t.network.netOutBurst}
                    placeholder={t.network.placeholderNetOutBurst}
                    inputProps={{
                      min: 1,
                      max: data ? data.out_link : undefined,
                    }}
                  />
                )}
              </createVMForm.AppField>
            </div>
            <Divider />
            <Button text={t.button} />
          </div>
        </createVMForm.AppForm>
        <div className="my-4"></div>
      </div>
    </>
  );
}
