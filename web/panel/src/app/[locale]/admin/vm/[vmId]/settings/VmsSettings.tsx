"use client";

import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import ButtonNoForm from "@/components/Form/Button/ButtonNoForm";
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
import { AdminServersResponse } from "../../../layout";

interface props {
  vmId: string;
  translations: {
    title: string;
    toast: {
      success: string;
      error: string;
      successDelete: string;
      errorDelete: string;
    };
    server: {
      title: string;
      vcpuAvailable: string;
      memoryAvailable: string;
      diskAvailable: string;
      networkInLink: string;
      networkOutLink: string;
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
    buttonUpdate: string;
    delete: {
      confirmation: string;
      button: string;
    };
  };
}

export default function VMsSettings({ vmId, translations: t }: props) {
  const router = useRouter();

  const { refetch } = useQuery({
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

  const { refetch: refetchVM } = useQuery({
    queryKey: qk.api.v1.admin.vms.getById(parseInt(vmId)),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/vms/${vmId}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.admin.vms.getById(parseInt(vmId))],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/vms/${vmId}?include_server=true`);
      if (!d.ok) {
        console.error("Failed to fetch VM data");
      }
      return d.json() as Promise<AdminGetVMByIDResponse>;
    },
  });

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
        toast.error(t.toast.error);
        console.error("Failed to update VM");
      }
      refetch();
      refetchVM();
      toast.success(t.toast.success);
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
  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="text-2xl">{t.title}</div>

        <div className="flex flex-col gap-y-3">
          <div className="text-xl">{t.server.title}</div>
          <div className="flex flex-col gap-y-1">
            <span>
              {t.server.vcpuAvailable}:{" "}
              {data?.include_server.serversVcpusAvailable}
            </span>
            <span>
              {t.server.memoryAvailable}:{" "}
              {data?.include_server.serversRamAvailable} MB
            </span>
            <span>
              {t.server.diskAvailable}:{" "}
              {data?.include_server.serversDiskAvailable} GB
            </span>
            <span>
              {t.server.networkInLink}:{" "}
              {data?.include_server.serversInLinkSpeedMbps} Mbps
            </span>
            <span>
              {t.server.networkOutLink}:{" "}
              {data?.include_server.serversOutLinkSpeedMbps} Mbps
            </span>
          </div>
        </div>
        <Divider />
        <updateVMForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <div className="text-xl">{t.general.title}</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText={t.general.name}
                    placeholder={t.general.placeholderName}
                  />
                )}
              </updateVMForm.AppField>
              <updateVMForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText={t.general.publicId}
                    placeholder={t.general.placeholderPublicId}
                  />
                )}
              </updateVMForm.AppField>
            </div>
            <Divider />
            <div className="text-xl">{t.resources.title}</div>
            <div className="flex flex-row gap-x-3 flex-wrap gap-y-3">
              <updateVMForm.AppField name="vcpus">
                {(field) => (
                  <field.InputField
                    inputId="vcpus"
                    inputName="vcpus"
                    inputType="number"
                    labelText={t.resources.vcpus}
                    placeholder={t.resources.placeholderVcpus}
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
                    labelText={t.resources.memory}
                    placeholder={t.resources.placeholderMemory}
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
                    labelText={t.resources.disk}
                    placeholder={t.resources.placeholderDisk}
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
            <div className="text-xl">{t.network.title}</div>
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
                    labelText={t.network.netInAvg}
                    placeholder={t.network.placeholderNetInAvg}
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
                    labelText={t.network.netInPeak}
                    placeholder={t.network.placeholderNetInPeak}
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
                    labelText={t.network.netInBurst}
                    placeholder={t.network.placeholderNetInBurst}
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
                    labelText={t.network.netOutAvg}
                    placeholder={t.network.placeholderNetOutAvg}
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
                    labelText={t.network.netOutPeak}
                    placeholder={t.network.placeholderNetOutPeak}
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
                    labelText={t.network.netOutBurst}
                    placeholder={t.network.placeholderNetOutBurst}
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
            <div className="flex flex-row flex-wrap gap-x-3">
              <Button text={t.buttonUpdate} />
              <ButtonNoForm
                button={{
                  onClick: async () => {
                    if (!confirm(t.delete.confirmation)) {
                      return;
                    }
                    const a = await apiFetch(`/api/v1/admin/vms/${vmId}`, {
                      method: "DELETE",
                    });
                    if (!a.ok) {
                      toast.error(t.toast.errorDelete);
                      return;
                    }
                    refetch();
                    toast.success(t.toast.successDelete);
                    router.push("/admin");
                  },
                }}
              >
                {t.delete.button}
              </ButtonNoForm>
            </div>
          </div>
        </updateVMForm.AppForm>
        <div className="my-4"></div>
      </div>
    </>
  );
}
