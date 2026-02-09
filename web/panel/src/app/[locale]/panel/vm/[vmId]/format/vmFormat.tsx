"use client";

import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import DebianIcon from "@/components/Icon/DebianIcon";
import UbuntuIcon from "@/components/Icon/UbuntuIcon";
import VMNavbar from "@/components/vm/navbar/navbar";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import z from "zod";

interface props {
  vmID: string;
  translations: {
    toast: {
      pending: string;
      success: string;
      error: string;
      already: string;
    };
    chooseImage: string;
    inputOs: string;
    inputOsVersion: string;
    yourCredentials: string;
    yourCredentialsSubtext: string;
    hostname: string;
    invalidHostname: string;
    placeholderHostname: string;
    username: string;
    invalidUsername: string;
    placeholderUsername: string;
    password: string;
    publicKey: string;
    invalidPassword: string;
    placeholderPassword: string;
    confirmPassword: string;
    invalidConfirmPassword: string;
    placeholderConfirmPassword: string;
    resetButton: string;
  };
}

export interface GetAllOSResponse {
  os: string;
  versions: {
    id: string;
    arch: string;
    version: string;
    status: string;
  }[];
}

export default function VMFormat({ vmID, translations: t }: props) {
  const {
    data: vmData,
    isLoading: vmIsLoading,
    refetch,
  } = useQuery({
    queryKey: qk.api.v1.vms.getVMById(parseInt(vmID)),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/vms/${vmID}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.os.getAllOS()],
    queryFn: async () => {
      return (await apiFetch("/api/v1/os")).json() as Promise<
        GetAllOSResponse[]
      >;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: {
      version: string;
      hostname: string;
      username: string;
      password?: string;
      publicKey?: string;
    }) => {
      return toast.promise(
        apiFetch(`/api/v1/vms/${vmID}/format`, {
          method: "POST",
          body: JSON.stringify({
            os: data.version,
            host: {
              hostname: data.hostname,
              username: data.username,
              password: data.password?.length === 0 ? undefined : data.password,
              publicKey:
                data.publicKey?.length === 0 ? undefined : data.publicKey,
            },
          }),
        }),
        {
          pending: t.toast.pending,
          success: t.toast.success,
          error: t.toast.error,
        },
      );
    },
  });
  const [selectedOption, setSelectedOption] = useState<
    "password" | "publicKey"
  >("password");
  const validate = z
    .object({
      os: z.string(),
      version: z.string(),
      hostname: z.string().min(3, t.invalidHostname),
      username: z.string().min(3, t.invalidUsername),
      password: z.string().min(8, t.invalidPassword),
      confirmPassword: z.string().min(8, t.invalidConfirmPassword),
      publicKey: z.string(),
    })
    .superRefine((data, ctx) => {
      if (selectedOption === "password") {
        if (data.password.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["password"],
            message: t.invalidPassword,
          });
        }
        if (data.confirmPassword.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["confirmPassword"],
            message: t.invalidConfirmPassword,
          });
        }
        if (data.password !== data.confirmPassword) {
          ctx.addIssue({
            code: "custom",
            path: ["confirmPassword"],
            message: t.invalidConfirmPassword,
          });
        }
      } else {
        if (!data.publicKey.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["publicKey"],
            message: t.publicKey,
          });
        }
      }
    });
  const form = useAppForm({
    defaultValues: {
      os: data ? data[0].os.toLowerCase() : "",
      version: data ? data[0].versions[0].id : "",
      hostname: "",
      username: "",
      password: "",
      confirmPassword: "",
      publicKey: "",
    },
    formId: "vm-format-form",
    validators: {
      onSubmit: validate,
    },
    onSubmit: async ({ value }) => {
      if (selectedOption === "password") {
        if (value.password !== value.confirmPassword) {
          form.setFieldMeta("confirmPassword", (meta) => ({
            ...meta,
            error: t.invalidConfirmPassword,
            errorMap: {
              ...meta.errorMap,
              custom: t.invalidConfirmPassword,
            },
          }));
          return;
        }
      }
      if (selectedOption === "publicKey") {
        value.password = "";
      } else {
        value.publicKey = "";
      }

      if (vmIsLoading) return;
      if (vmData?.status === "FORMATTING") {
        toast.error(t.toast.already);
        return;
      }
      mutation.mutate(value);
    },
  });

  return (
    <>
      <form.AppForm>
        <form action="" className="flex flex-col gap-y-4">
          {vmData?.status !== "OPERATIONAL" && (
            <>
              <div className="flex flex-row items-center gap-x-1">
                <div className="bg-yellow-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                <span className="text-sm text-(--color-foreground-secondary)">
                  {vmData?.status}
                </span>
              </div>
            </>
          )}
          <div className="flex flex-col gap-y-2">
            <div className="text-xl">{t.chooseImage}</div>
            <div className="flex flex-col pl-3 gap-y-2">
              <div className="flex flex-row">
                <div className="flex flex-row items-center">
                  <form.AppField name="os">
                    {(field) => (
                      <>
                        <field.SelectField
                          labelText={t.inputOs}
                          inputName="os"
                          inputId="os"
                          options={
                            data
                              ? data.map((os) => ({
                                  label: os.os,
                                  value: os.os.toLowerCase(),
                                }))
                              : []
                          }
                        >
                          {form.getFieldValue("os").toLowerCase() ===
                            "ubuntu" && <UbuntuIcon className="mr-2 w-5 h-5" />}
                          {form.getFieldValue("os").toLowerCase() ===
                            "debian" && <DebianIcon className="mr-2 w-5 h-5" />}
                        </field.SelectField>
                      </>
                    )}
                  </form.AppField>
                </div>
              </div>
              <div className="flex flex-row">
                <form.AppField name="version">
                  {(field) => (
                    <field.SelectField
                      labelText={t.inputOsVersion}
                      inputName="version"
                      inputId="version"
                      options={
                        data
                          ? data
                              .find(
                                (os) =>
                                  os.os.toLowerCase() ===
                                  form.getFieldValue("os").toLowerCase(),
                              )
                              ?.versions.map((version) => ({
                                label: `${version.version} (${version.arch.toLowerCase()})`,
                                value: version.id,
                              })) || []
                          : []
                      }
                    />
                  )}
                </form.AppField>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-3">
            <div className="text-xl flex flex-col">
              {t.yourCredentials}
              <div className="text-xs">{t.yourCredentialsSubtext}</div>
            </div>

            <div className="ml-2 flex flex-col gap-y-2">
              <form.AppField name="hostname">
                {(field) => (
                  <field.InputField
                    labelText={t.hostname}
                    inputType="text"
                    inputName="hostname"
                    inputId="hostname"
                  />
                )}
              </form.AppField>
              <form.AppField name="username">
                {(field) => (
                  <field.InputField
                    labelText={t.username}
                    inputType="text"
                    inputName="username"
                    inputId="username"
                  />
                )}
              </form.AppField>
              <div className="flex flex-row bg-(--color-background-primary) w-fit p-1 rounded-md mt-2 items-center gap-x-2">
                <div
                  className={`${selectedOption === "password" ? "bg-(--color-background-selected) cursor-not-allowed" : "bg-(--color-background-primary) cursor-pointer"} rounded-md shadow-lg p-2`}
                  onClick={() => setSelectedOption("password")}
                >
                  {t.password}
                </div>
                {/* <div
                  className={`${selectedOption === "publicKey" ? "bg-(--color-background-selected) cursor-not-allowed" : "bg-(--color-background-primary) cursor-pointer"} rounded-md shadow-lg p-2`}
                  onClick={() => setSelectedOption("publicKey")}
                >
                  {t.publicKey}
                </div> */}
              </div>
              {selectedOption === "password" ? (
                <>
                  <form.AppField name="password">
                    {(field) => (
                      <field.InputField
                        labelText={t.password}
                        inputType="password"
                        inputName="password"
                        inputId="password"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="confirmPassword">
                    {(field) => (
                      <field.InputField
                        labelText={t.confirmPassword}
                        inputType="password"
                        inputName="confirmPassword"
                        inputId="confirmPassword"
                      />
                    )}
                  </form.AppField>
                </>
              ) : (
                <form.AppField name="publicKey">
                  {(field) => (
                    <field.InputField
                      labelText={t.publicKey}
                      inputType="text"
                      inputName="publicKey"
                      inputId="publicKey"
                    />
                  )}
                </form.AppField>
              )}
              <Button
                text={t.resetButton}
                disabled={
                  vmData?.status !== "OPERATIONAL" ||
                  vmData?.state === "unknown" ||
                  mutation.isPending
                }
              />
            </div>
          </div>
        </form>
      </form.AppForm>
    </>
  );
}
