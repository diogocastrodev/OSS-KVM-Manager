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
import { AdminServersResponse } from "../../layout";
import cidrToNetmask from "@/utils/CIDRtoNetmask";

export interface TryInfoResponse {
  message: string;
  info: {
    cpus: number;
    vcpus: number;
    memory_mb: number;
    disk: number;
    network?: {
      prefix: string;
      gateway: string;
      network: string;
    };
  };
}

interface props {
  translations: {
    title: string;
    toast: {
      trySuccess: string;
      tryError: string;
      createSuccess: string;
      createError: string;
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
    button: string;
  };
}

export default function AdminCreatePage({ translations: t }: props) {
  const { refetch: refetchServers } = useQuery({
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
        console.error("Failed to fetch server info");
      }
      return res.json() as Promise<TryInfoResponse>;
    },
    onSuccess: (data) => {
      const memory = Math.trunc(data.info.memory_mb);
      const disk = Math.trunc(data.info.disk / 1024);
      createServerForm.setFieldValue("cpus", data.info.cpus + "");
      createServerForm.setFieldValue("vcpus", data.info.vcpus + "");
      createServerForm.setFieldValue("memory_mb", memory + "");
      createServerForm.setFieldValue("disk", disk + "");
      createServerForm.setFieldValue("vcpus_max", data.info.vcpus + "");
      createServerForm.setFieldValue("memory_mb_max", memory + "");
      createServerForm.setFieldValue("disk_max", disk + "");
      if (data.info.network) {
        createServerForm.setFieldValue("network", data.info.network.network);
        createServerForm.setFieldValue(
          "network_mask",
          data.info.network.prefix,
        );
        createServerForm.setFieldValue(
          "network_gateway",
          data.info.network.gateway,
        );
      }
    },
  });

  const { mutate: createServer } = useMutation({
    mutationKey: [qk.api.v1.admin.servers.create()],
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
      vms_network: string;
      vms_network_mask: string;
      vms_network_gateway: string;
    }) => {
      const res = await apiFetch("/api/v1/admin/servers", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) console.error("Failed to create server");
      return res.json();
    },
    onSuccess: () => {
      createServerForm.reset();
      refetchServers();
    },
  });

  const createServerFormValidate = z.object({
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
    network: z.string(),
    network_mask: z.string(),
    network_gateway: z.string(),
  });

  const createServerForm = useAppForm({
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
      onSubmit: createServerFormValidate,
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
      createServer({
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
        vms_network: value.network,
        vms_network_mask: value.network_mask,
        vms_network_gateway: value.network_gateway,
      });
    },
  });

  return (
    <>
      <div className="">
        <div className="text-2xl pb-2">{t.title}</div>
        <createServerForm.AppForm>
          <div className="flex flex-col gap-y-3">
            <createServerForm.AppField name="server_endpoint">
              {(field) => (
                <field.InputField
                  inputId="server_endpoint"
                  inputName="server_endpoint"
                  inputType="text"
                  labelText={t.endpoint.agentEndpoint}
                  placeholder={t.endpoint.placeholderAgentEndpoint}
                />
              )}
            </createServerForm.AppField>
            <div className="flex flex-row gap-x-3">
              <ButtonNoForm
                button={{
                  type: "button",
                  onClick: (e) => {
                    e.preventDefault();
                    const server_endpoint =
                      createServerForm.getFieldValue("server_endpoint");
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
              <div className="text-red-500">{t.dataFound.failed}</div>
            )}
            <Divider />
            <div className="text-lg">{t.general.title}</div>
            <div className="flex flex-row flex-wrap items-center gap-x-8">
              <createServerForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    inputId="name"
                    inputName="name"
                    inputType="text"
                    labelText={t.general.name}
                    placeholder={t.general.placeholderName}
                  />
                )}
              </createServerForm.AppField>
              <createServerForm.AppField name="publicId">
                {(field) => (
                  <field.InputField
                    inputId="publicId"
                    inputName="publicId"
                    inputType="number"
                    labelText={t.general.publicId}
                    placeholder={t.general.placeholderPublicId}
                  />
                )}
              </createServerForm.AppField>
            </div>
            <Divider />
            <div className="flex flex-row gap-x-8 gap-y-4 flex-wrap">
              <div className="flex flex-col gap-y-3">
                <div className="text-lg">{t.resources.title}</div>
                <createServerForm.AppField name="cpus">
                  {(field) => (
                    <field.InputField
                      inputId="cpus"
                      inputName="cpus"
                      inputType="number"
                      labelText={t.resources.cpus}
                      placeholder={t.resources.placeholderCpus}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="vcpus">
                  {(field) => (
                    <field.InputField
                      inputId="vcpus"
                      inputName="vcpus"
                      inputType="number"
                      labelText={t.resources.vcpus}
                      placeholder={t.resources.placeholderVcpus}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="memory_mb">
                  {(field) => (
                    <field.InputField
                      inputId="memory_mb"
                      inputName="memory_mb"
                      inputType="number"
                      labelText={t.resources.memory}
                      placeholder={t.resources.placeholderMemory}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="disk">
                  {(field) => (
                    <field.InputField
                      inputId="disk"
                      inputName="disk"
                      inputType="number"
                      labelText={t.resources.disk}
                      placeholder={t.resources.placeholderDisk}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="in_link_mbps">
                  {(field) => (
                    <field.InputField
                      inputId="in_link_mbps"
                      inputName="in_link_mbps"
                      inputType="number"
                      labelText={t.resources.inLink}
                      placeholder={t.resources.placeholderInLink}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="out_link_mbps">
                  {(field) => (
                    <field.InputField
                      inputId="out_link_mbps"
                      inputName="out_link_mbps"
                      inputType="number"
                      labelText={t.resources.outLink}
                      placeholder={t.resources.placeholderOutLink}
                    />
                  )}
                </createServerForm.AppField>
              </div>
              <div className="flex flex-col gap-y-3">
                <div className="text-lg">{t.maxResources.title}</div>
                <div className="h-15">{/* Spacer */}</div>
                <createServerForm.AppField name="vcpus_max">
                  {(field) => (
                    <field.InputField
                      inputId="vcpus_max"
                      inputName="vcpus_max"
                      inputType="number"
                      labelText={t.maxResources.vcpus}
                      placeholder={t.maxResources.placeholderVcpus}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="memory_mb_max">
                  {(field) => (
                    <field.InputField
                      inputId="memory_mb_max"
                      inputName="memory_mb_max"
                      inputType="number"
                      labelText={t.maxResources.memory}
                      placeholder={t.maxResources.placeholderMemory}
                    />
                  )}
                </createServerForm.AppField>
                <createServerForm.AppField name="disk_max">
                  {(field) => (
                    <field.InputField
                      inputId="disk_max"
                      inputName="disk_max"
                      inputType="number"
                      labelText={t.maxResources.disk}
                      placeholder={t.maxResources.placeholderDisk}
                    />
                  )}
                </createServerForm.AppField>
              </div>
            </div>
            <Divider />
            <div className="text-xl">{t.network.title}</div>
            <div className="flex flex-row gap-x-8 gap-y-3 flex-wrap">
              <createServerForm.AppField name="network">
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
                            createServerForm.setFieldValue(
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

                          createServerForm.setFieldValue("network", ip);
                          if (
                            Number.isInteger(prefix) &&
                            prefix >= 0 &&
                            prefix <= 32
                          ) {
                            createServerForm.setFieldValue(
                              "network_mask",
                              cidrToNetmask(prefix),
                            );
                          }
                        },
                      }}
                    />
                  );
                }}
              </createServerForm.AppField>
              <createServerForm.AppField name="network_mask">
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
              </createServerForm.AppField>
              <createServerForm.AppField name="network_gateway">
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
              </createServerForm.AppField>
            </div>
            <Divider />
            <Button text={t.button} />
          </div>
        </createServerForm.AppForm>
      </div>
    </>
  );
}
