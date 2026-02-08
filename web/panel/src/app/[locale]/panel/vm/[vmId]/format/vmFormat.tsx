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

export default function VMFormat({ vmID }: props) {
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
          pending: "Requesting VM format...",
          success: "VM formatting started successfully!",
          error: "Failed to start VM formatting. Please try again.",
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
      hostname: z.string().min(3, "Hostname must be at least 3 characters"),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z
        .string()
        .min(8, "Confirm Password must be at least 8 characters"),
      publicKey: z.string(),
    })
    .superRefine((data, ctx) => {
      if (selectedOption === "password") {
        if (data.password.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["password"],
            message: "Password must be at least 8 characters",
          });
        }
        if (data.confirmPassword.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["confirmPassword"],
            message: "Confirm Password must be at least 8 characters",
          });
        }
        if (data.password !== data.confirmPassword) {
          ctx.addIssue({
            code: "custom",
            path: ["confirmPassword"],
            message: "Passwords do not match",
          });
        }
      } else {
        if (!data.publicKey.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["publicKey"],
            message: "Public key is required",
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
            error: "Passwords do not match",
            errorMap: {
              ...meta.errorMap,
              custom: "Passwords do not match",
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
        toast.error("VM is already being formatted. Please wait.");
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
            <div className="text-xl">Choose your Image:</div>
            <div className="flex flex-col pl-3 gap-y-2">
              <div className="flex flex-row">
                <div className="flex flex-row items-center">
                  <form.AppField name="os">
                    {(field) => (
                      <>
                        <field.SelectField
                          labelText="Operative System:"
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
                      labelText="Operative System Version:"
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
              Your new credentials:
              <div className="text-xs">
                This action will format your virtual machine and erase all data.
              </div>
            </div>

            <div className="ml-2 flex flex-col gap-y-2">
              <form.AppField name="hostname">
                {(field) => (
                  <field.InputField
                    labelText={"Hostname"}
                    inputType="text"
                    inputName="hostname"
                    inputId="hostname"
                  />
                )}
              </form.AppField>
              <form.AppField name="username">
                {(field) => (
                  <field.InputField
                    labelText={"Username"}
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
                  Password
                </div>
                {/* <div
                  className={`${selectedOption === "publicKey" ? "bg-(--color-background-selected) cursor-not-allowed" : "bg-(--color-background-primary) cursor-pointer"} rounded-md shadow-lg p-2`}
                  onClick={() => setSelectedOption("publicKey")}
                >
                  Public Key
                </div> */}
              </div>
              {selectedOption === "password" ? (
                <>
                  <form.AppField name="password">
                    {(field) => (
                      <field.InputField
                        labelText={"Password"}
                        inputType="password"
                        inputName="password"
                        inputId="password"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="confirmPassword">
                    {(field) => (
                      <field.InputField
                        labelText={"Confirm Password"}
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
                      labelText={"Public Key"}
                      inputType="text"
                      inputName="publicKey"
                      inputId="publicKey"
                    />
                  )}
                </form.AppField>
              )}
              <Button
                text="Format"
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
