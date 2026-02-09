"use client";

import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import ButtonNoForm from "@/components/Form/Button/ButtonNoForm";
import { useAppForm } from "@/components/Form/useAppForm";
import Loader from "@/components/Loader/Loader";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import z from "zod";
import cidrToNetmask from "@/utils/CIDRtoNetmask";
import { TryInfoResponse } from "../../create/AdminCreatePage";
import { ServerData } from "@/components/vm/navbar/navbarAdminServer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { AdminServersResponse } from "../../../layout";

interface props {
  serverId: number;
  translations: {
    title: string;
    toast: {
      trySuccess: string;
      tryError: string;
      updateSuccess: string;
      updateError: string;
      deleteSuccess: string;
      deleteError: string;
    };
    endpoint: {
      agentEndpoint: string;
      invalidAgentEndpoint: string;
      placeholderAgentEndpoint: string;
      tryFinding: string;
    };
    dataFound: {
      title: string;
      cpus: string;
      vcpus: string;
      memory: string;
      disk: string;
      failed: string;
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
      cpus: string;
      invalidCpus: string;
      placeholderCpus: string;
      vcpus: string;
      invalidVcpus: string;
      placeholderVcpus: string;
      memory: string;
      invalidMemory: string;
      placeholderMemory: string;
      disk: string;
      invalidDisk: string;
      placeholderDisk: string;
      inLink: string;
      invalidInLink: string;
      placeholderInLink: string;
      outLink: string;
      invalidOutLink: string;
      placeholderOutLink: string;
    };
    maxResources: {
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
      vmNetwork: string;
      invalidVmNetwork: string;
      placeholderVmNetwork: string;
      vmNetworkMask: string;
      invalidVmNetworkMask: string;
      placeholderVmNetworkMask: string;
      vmNetworkGateway: string;
      invalidVmNetworkGateway: string;
      placeholderVmNetworkGateway: string;
    };
    buttonUpdate: string;
    delete: {
      confirmation: string;
      button: string;
    };
  };
}

export default function ServerSettings({ serverId, translations: t }: props) {
  const router = useRouter();
  const { data, refetch: refetchServer } = useQuery({
    queryKey: qk.api.v1.admin.servers.getById(serverId),
    queryFn: async () =>
      await apiFetch(`/api/v1/admin/servers/${serverId}`).then((res) => {
        if (!res.ok) {
          console.error("Failed to fetch server data");
        }
        return res.json() as Promise<ServerData>;
      }),
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

  useEffect(() => {
    if (data) {
      updateServerForm.setFieldValue("name", data.name);
      updateServerForm.setFieldValue("publicId", data.publicId + "");
      updateServerForm.setFieldValue(
        "server_endpoint",
        `${data.ipLocal}:${data.agent_port}`,
      );
      updateServerForm.setFieldValue("cpus", data.cpus + "");
      updateServerForm.setFieldValue("vcpus", data.vcpus + "");
      updateServerForm.setFieldValue("memory_mb", data.ram + "");
      updateServerForm.setFieldValue("disk", data.disk + "");
      updateServerForm.setFieldValue("in_link_mbps", data.in_link + "");
      updateServerForm.setFieldValue("out_link_mbps", data.out_link + "");
      updateServerForm.setFieldValue("vcpus_max", data.vcpus_max + "");
      updateServerForm.setFieldValue("memory_mb_max", data.ram_max + "");
      updateServerForm.setFieldValue("disk_max", data.disk_max + "");
      updateServerForm.setFieldValue("network", data.vms_network || "");
      updateServerForm.setFieldValue(
        "network_mask",
        data.vms_network_mask || "",
      );
      updateServerForm.setFieldValue("network_gateway", data.vms_gateway || "");
    }
  }, [data]);

  const {
    data: dataTryInfo,
    isPending: isPendingTryInfo,
    mutate: tryInfo,
    isError: isErrorTryInfo,
  } = useMutation({
    mutationFn: async (server_endpoint: string) => {
      const res = await apiFetch("/api/v1/admin/servers/try-info", {
        method: "POST",
        body: JSON.stringify({ server_endpoint }),
      });

      if (!res.ok) {
        toast.error(t.toast.tryError);
        console.error("Failed to fetch server info");
      }
      return res.json() as Promise<TryInfoResponse>;
    },
    onSuccess: (data) => {
      const memory = Math.trunc(data.info.memory_mb);
      const disk = Math.trunc(data.info.disk / 1024);
      updateServerForm.setFieldValue("cpus", data.info.cpus + "");
      updateServerForm.setFieldValue("vcpus", data.info.vcpus + "");
      updateServerForm.setFieldValue("memory_mb", memory + "");
      updateServerForm.setFieldValue("disk", disk + "");
      if (data.info.network) {
        updateServerForm.setFieldValue("network", data.info.network.network);
        updateServerForm.setFieldValue(
          "network_mask",
          data.info.network.prefix,
        );
        updateServerForm.setFieldValue(
          "network_gateway",
          data.info.network.gateway,
        );
      }
      toast.success(t.toast.trySuccess);
    },
  });

  const { mutate: updateServer } = useMutation({
    mutationKey: [qk.api.v1.admin.servers.update(serverId)],
    mutationFn: async (data: {
      publicId: number;
      name: string;
      server_endpoint: string;
      cpus: number;
      vcpus: number;
      memory_mb: number;
      disk: number;
      in_link_mbps: number;
      out_link_mbps: number;
      vcpus_max: number;
      memory_mb_max: number;
      disk_max: number;
      vm_network: string;
      vm_network_mask: string;
      vm_network_gateway: string;
    }) => {
      const res = await apiFetch(`/api/v1/admin/servers/${serverId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        toast.error(t.toast.updateError);
        console.error("Failed to update server");
      }
      return res.json();
    },
    onSuccess: () => {
      updateLayout();
      toast.success(t.toast.updateSuccess);
      router.push(`/admin/server/${serverId}`);
    },
  });

  const updateServerSchema = z.object({
    publicId: z
      .string()
      .regex(/^\d+$/, t.general.invalidPublicId)
      .transform(Number)
      .pipe(z.number().nonnegative()),
    name: z.string().min(1, {
      message: t.general.invalidName,
    }),
    server_endpoint: z
      .string()
      .regex(
        /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]):(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)$/,
        t.endpoint.invalidAgentEndpoint,
      ),
    cpus: z
      .string()
      .regex(/^\d+$/, t.resources.invalidCpus)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    vcpus: z
      .string()
      .regex(/^\d+$/, t.resources.invalidVcpus)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    memory_mb: z
      .string()
      .regex(/^\d+$/, t.resources.invalidMemory)
      .transform(Number)
      .pipe(z.number().nonnegative().min(256)),
    disk: z
      .string()
      .regex(/^\d+$/, t.resources.invalidDisk)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    in_link_mbps: z
      .string()
      .regex(/^\d+$/, t.resources.invalidInLink)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    out_link_mbps: z
      .string()
      .regex(/^\d+$/, t.resources.invalidOutLink)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    vcpus_max: z
      .string()
      .regex(/^\d+$/, t.maxResources.invalidVcpus)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    memory_mb_max: z
      .string()
      .regex(/^\d+$/, t.maxResources.invalidMemory)
      .transform(Number)
      .pipe(z.number().nonnegative().min(256)),
    disk_max: z
      .string()
      .regex(/^\d+$/, t.maxResources.invalidDisk)
      .transform(Number)
      .pipe(z.number().nonnegative().min(1)),
    network: z.ipv4(),
    network_mask: z
      .string()
      .regex(
        /^(?:255\.(?:255\.(?:255\.(?:255|254|252|248|240|224|192|128|0)|(?:254|252|248|240|224|192|128|0)\.0)|(?:254|252|248|240|224|192|128|0)\.0\.0)|(?:254|252|248|240|224|192|128|0)\.0\.0\.0|0\.0\.0\.0)$/,
        t.network.invalidVmNetworkMask,
      ),
    network_gateway: z
      .string()
      .regex(
        /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])$/,
        t.network.invalidVmNetworkGateway,
      ),
  });

  const updateServerForm = useAppForm({
    defaultValues: {
      publicId: "",
      name: "",
      server_endpoint: "",
      cpus: "",
      vcpus: "",
      memory_mb: "",
      disk: "",
      in_link_mbps: "",
      out_link_mbps: "",
      vcpus_max: "",
      memory_mb_max: "",
      disk_max: "",
      network: "",
      network_mask: "",
      network_gateway: "",
    },
    validators: {
      onSubmit: updateServerSchema,
    },
    onSubmit: async ({ value }) => {
      const vcpus = parseInt(value.vcpus);
      const vcpus_max = parseInt(value.vcpus_max);
      const memory_mb = parseInt(value.memory_mb);
      const memory_mb_max = parseInt(value.memory_mb_max);
      const disk = parseInt(value.disk);
      const disk_max = parseInt(value.disk_max);
      if (disk_max > disk) {
        alert("Max disk cannot be greater than disk");
        return;
      }
      if (memory_mb_max > memory_mb) {
        alert("Max memory cannot be greater than memory");
        return;
      }
      if (vcpus_max > vcpus) {
        alert("Max vCPUs cannot be greater than vCPUs");
        return;
      }
      updateServer({
        publicId: parseInt(value.publicId),
        name: value.name,
        server_endpoint: value.server_endpoint,
        cpus: parseInt(value.cpus),
        vcpus: parseInt(value.vcpus),
        memory_mb: parseInt(value.memory_mb),
        disk: parseInt(value.disk),
        in_link_mbps: parseInt(value.in_link_mbps),
        out_link_mbps: parseInt(value.out_link_mbps),
        vcpus_max: parseInt(value.vcpus_max),
        memory_mb_max: parseInt(value.memory_mb_max),
        disk_max: parseInt(value.disk_max),
        vm_network: value.network,
        vm_network_mask: value.network_mask,
        vm_network_gateway: value.network_gateway,
      });
    },
  });

  const deleteServerMutation = useMutation({
    mutationKey: [qk.api.v1.admin.servers.delete(serverId)],
    mutationFn: async () => {
      const res = await apiFetch(`/api/v1/admin/servers/${serverId}`, {
        method: "DELETE",
      });
      if (!res.ok) console.error("Failed to delete server");
      return res.json();
    },
    onSuccess: () => {
      updateLayout();
      router.push("/admin");
    },
  });

  return (
    <>
      <div className="">
        <div className="text-2xl pb-2">{t.title}</div>
        <updateServerForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <updateServerForm.AppField name="server_endpoint">
              {(field) => (
                <field.InputField
                  inputId="server_endpoint"
                  inputName="server_endpoint"
                  inputType="text"
                  labelText={t.endpoint.agentEndpoint}
                  placeholder={t.endpoint.placeholderAgentEndpoint}
                />
              )}
            </updateServerForm.AppField>
            <div className="flex flex-row gap-x-3">
              <ButtonNoForm
                button={{
                  type: "button",
                  onClick: (e) => {
                    e.preventDefault();
                    const server_endpoint =
                      updateServerForm.getFieldValue("server_endpoint");
                    tryInfo(server_endpoint);
                  },
                  disabled: isPendingTryInfo,
                }}
              >
                {t.endpoint.tryFinding}
              </ButtonNoForm>
              {isPendingTryInfo && <Loader></Loader>}
            </div>
            {dataTryInfo && !isPendingTryInfo && (
              <>
                <Divider />
                <div className="flex flex-col gap-y-2">
                  <div>{t.dataFound.title}</div>
                  <div>
                    {t.dataFound.cpus}: {dataTryInfo.info.cpus}
                  </div>
                  <div>
                    {t.dataFound.vcpus}: {dataTryInfo.info.vcpus}
                  </div>
                  <div className="flex flex-row gap-x-1">
                    <span className="">
                      {t.dataFound.memory}:{" "}
                      {Math.trunc(dataTryInfo.info.memory_mb / 1024)}
                      GB
                    </span>
                    <span className="text-xs justify-self-end self-end">
                      ({Math.trunc(dataTryInfo.info.memory_mb)} MB)
                    </span>
                  </div>
                  <div>
                    {t.dataFound.disk}:{" "}
                    {Math.trunc(dataTryInfo.info.disk / 1024)} GB
                  </div>
                </div>
              </>
            )}
            {isErrorTryInfo && !isPendingTryInfo && (
              <div className="text-red-500">Failed to fetch server info</div>
            )}
            <Divider />
            <div className="text-lg">{t.general.title}</div>
            <div className="flex flex-row flex-wrap items-center gap-x-8">
              <updateServerForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText={t.general.name}
                    placeholder={t.general.placeholderName}
                  />
                )}
              </updateServerForm.AppField>
              <updateServerForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText={t.general.publicId}
                    placeholder={t.general.placeholderPublicId}
                  />
                )}
              </updateServerForm.AppField>
            </div>
            <Divider />
            <div className="flex flex-row gap-x-8 gap-y-4 flex-wrap">
              <div className="flex flex-col gap-y-3">
                <div className="text-lg">{t.resources.title}</div>
                <updateServerForm.AppField name="cpus">
                  {(field) => (
                    <field.InputField
                      inputId="cpus"
                      inputName="cpus"
                      inputType="number"
                      labelText={t.resources.cpus}
                      placeholder={t.resources.placeholderCpus}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="vcpus">
                  {(field) => (
                    <field.InputField
                      inputId="vcpus"
                      inputName="vcpus"
                      inputType="number"
                      labelText={t.resources.vcpus}
                      placeholder={t.resources.placeholderVcpus}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="memory_mb">
                  {(field) => (
                    <field.InputField
                      inputId="memory_mb"
                      inputName="memory_mb"
                      inputType="number"
                      labelText={t.resources.memory}
                      placeholder={t.resources.placeholderMemory}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="disk">
                  {(field) => (
                    <field.InputField
                      inputId="disk"
                      inputName="disk"
                      inputType="number"
                      labelText={t.resources.disk}
                      placeholder={t.resources.placeholderDisk}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="in_link_mbps">
                  {(field) => (
                    <field.InputField
                      inputId="in_link_mbps"
                      inputName="in_link_mbps"
                      inputType="number"
                      labelText={t.resources.inLink}
                      placeholder={t.resources.placeholderInLink}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="out_link_mbps">
                  {(field) => (
                    <field.InputField
                      inputId="out_link_mbps"
                      inputName="out_link_mbps"
                      inputType="number"
                      labelText={t.resources.outLink}
                      placeholder={t.resources.placeholderOutLink}
                    />
                  )}
                </updateServerForm.AppField>
              </div>
              <div className="flex flex-col gap-y-3">
                <div className="text-lg">{t.maxResources.title}</div>
                <div className="h-15">{/* Spacer */}</div>
                <updateServerForm.AppField name="vcpus_max">
                  {(field) => (
                    <field.InputField
                      inputId="vcpus_max"
                      inputName="vcpus_max"
                      inputType="number"
                      labelText={t.maxResources.vcpus}
                      placeholder={t.maxResources.placeholderVcpus}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="memory_mb_max">
                  {(field) => (
                    <field.InputField
                      inputId="memory_mb_max"
                      inputName="memory_mb_max"
                      inputType="number"
                      labelText={t.maxResources.memory}
                      placeholder={t.maxResources.placeholderMemory}
                    />
                  )}
                </updateServerForm.AppField>
                <updateServerForm.AppField name="disk_max">
                  {(field) => (
                    <field.InputField
                      inputId="disk_max"
                      inputName="disk_max"
                      inputType="number"
                      labelText={t.maxResources.disk}
                      placeholder={t.maxResources.placeholderDisk}
                    />
                  )}
                </updateServerForm.AppField>
              </div>
            </div>
            <Divider />
            <div className="text-xl">{t.network.title}</div>
            <div className="flex flex-row gap-x-8 gap-y-3 flex-wrap">
              <updateServerForm.AppField name="network">
                {(field) => {
                  return (
                    <field.InputField
                      inputId="network"
                      inputName="network"
                      inputType="text"
                      labelText={t.network.vmNetwork}
                      placeholder={t.network.placeholderVmNetwork}
                      inputProps={{
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const raw = e.target.value;
                          // keep exactly what user types so caret/focus doesn't jump
                          field.handleChange(raw);

                          const m = raw
                            .trim()
                            .match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
                          if (!m) return;

                          const prefix = Number(m[2]);
                          if (
                            Number.isInteger(prefix) &&
                            prefix >= 0 &&
                            prefix <= 32
                          ) {
                            updateServerForm.setFieldValue(
                              "network_mask",
                              cidrToNetmask(prefix),
                            );
                          }
                        },
                        onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                          // IMPORTANT: keep the form library's blur behavior too if you have it
                          field.handleBlur();

                          const raw = e.target.value.trim();
                          const m = raw.match(
                            /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/,
                          );
                          if (!m) return;

                          const ip = m[1];
                          const prefix = Number(m[2]);

                          updateServerForm.setFieldValue("network", ip);
                          if (
                            Number.isInteger(prefix) &&
                            prefix >= 0 &&
                            prefix <= 32
                          ) {
                            updateServerForm.setFieldValue(
                              "network_mask",
                              cidrToNetmask(prefix),
                            );
                          }
                        },
                      }}
                    />
                  );
                }}
              </updateServerForm.AppField>
              <updateServerForm.AppField name="network_mask">
                {(field) => {
                  return (
                    <field.InputField
                      inputId="network_mask"
                      inputName="network_mask"
                      inputType="text"
                      labelText={t.network.vmNetworkMask}
                      placeholder={t.network.placeholderVmNetworkMask}
                    />
                  );
                }}
              </updateServerForm.AppField>
              <updateServerForm.AppField name="network_gateway">
                {(field) => {
                  return (
                    <field.InputField
                      inputId="network_gateway"
                      inputName="network_gateway"
                      inputType="text"
                      labelText={t.network.vmNetworkGateway}
                      placeholder={t.network.placeholderVmNetworkGateway}
                    />
                  );
                }}
              </updateServerForm.AppField>
            </div>
            <Divider />
            <div className="flex flex-row gap-x-3">
              <Button text={t.buttonUpdate} />
              <ButtonNoForm
                button={{
                  onClick: () => {
                    if (!confirm(t.delete.confirmation)) return;

                    deleteServerMutation.mutate();
                  },
                }}
              >
                {t.delete.button}
              </ButtonNoForm>
            </div>
            <div className="h-8"></div>
          </div>
        </updateServerForm.AppForm>
      </div>
    </>
  );
}
