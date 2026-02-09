"use client";

import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import moment from "moment";
import { toast } from "react-toastify";
import z, { refine } from "zod";

export interface ProfilePageData {
  name: string;
  email: string;
  logins: {
    id: string;
    platformName: string;
    createdAt: string;
    lastUsed: string;
  }[];
}

interface props {
  translations: {
    title: string;
    data: {
      title: string;
      name: string;
      invalidName: string;
      placeholderName: string;
      email: string;
      invalidEmail: string;
      placeholderEmail: string;
      updateButton: string;
      toast: {
        success: string;
        error: string;
      };
    };
    password: {
      title: string;
      currentPassword: string;
      invalidCurrentPassword: string;
      placeholderCurrentPassword: string;
      password: string;
      invalidPassword: string;
      placeholderPassword: string;
      confirmPassword: string;
      invalidConfirmPassword: string;
      placeholderConfirmPassword: string;
      updateButton: string;
      toast: {
        success: string;
        error: string;
      };
    };
    devices: {
      title: string;
      platform: string;
      createdAt: string;
      lastUsed: string;
      actions: string;
      removeButton: string;
      removeAllButton: string;
      toast: {
        removeSuccess: string;
        removeError: string;
        removeAllSuccess: string;
        removeAllError: string;
      };
    };
  };
}

export default function ProfilePage({ translations: t }: props) {
  const { data, refetch: refetchProfile } = useQuery({
    queryKey: [qk.api.v1.user.profile()],
    queryFn: async () => {
      return await apiFetch("/api/v1/user/profile").then(
        (res) => res.json() as Promise<ProfilePageData>,
      );
    },
  });

  const updateDataMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      return await apiFetch("/api/v1/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
  });

  const changeDataValidator = z.object({
    name: z.string().min(1, t.data.invalidName),
    email: z.email(t.data.invalidEmail),
  });

  const changeDataForm = useAppForm({
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
    },
    validators: {
      onSubmit: changeDataValidator,
    },
    onSubmit: async ({ value }) => {
      await updateDataMutation.mutateAsync(value).then((res) => {
        if (!res.ok) {
          toast(t.data.toast.error, {
            type: "error",
          });
        } else {
          refetchProfile();
          toast(t.data.toast.success, {
            type: "success",
          });
        }
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return await apiFetch("/api/v1/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
  });

  const changePasswordValidator = z
    .object({
      currentPassword: z.string().min(1, t.password.invalidCurrentPassword),
      newPassword: z.string().min(8, t.password.invalidPassword),
      confirmNewPassword: z.string().min(1, t.password.invalidConfirmPassword),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: t.password.toast.error,
    });

  const changePasswordForm = useAppForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validators: {
      onSubmit: changePasswordValidator,
    },
    onSubmit: async ({ value }) => {
      await updatePasswordMutation
        .mutateAsync({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        })
        .then((res) => {
          if (!res.ok) {
            toast(t.password.toast.error, {
              type: "error",
            });
          } else {
            changePasswordForm.reset();
            toast(t.password.toast.success, {
              type: "success",
            });
          }
        });
    },
  });

  const removeDevice = async (id: string) => {
    await apiFetch(`/api/v1/user/sessions/${id}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        toast(t.devices.toast.removeError, {
          type: "error",
        });
      } else {
        refetchProfile();
        toast(t.devices.toast.removeSuccess, {
          type: "success",
        });
      }
    });
  };

  const removeAllDevices = async () => {
    await apiFetch("/api/v1/user/sessions", {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        toast(t.devices.toast.removeAllError, {
          type: "error",
        });
      } else {
        refetchProfile();
        toast(t.devices.toast.removeAllSuccess, {
          type: "success",
        });
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-2 p-4">
        <div className="text-2xl font-bold">{t.title}</div>
        <div className="flex flex-col gap-y-2">
          <div className="text-xl">{t.data.title}</div>
          <changeDataForm.AppForm>
            <div className="flex flex-col gap-y-3">
              <changeDataForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    labelText={t.data.name}
                    placeholder={t.data.placeholderName}
                    inputId="name"
                    inputName="name"
                    inputType="text"
                  />
                )}
              </changeDataForm.AppField>
              <changeDataForm.AppField name="email">
                {(field) => (
                  <field.InputField
                    labelText={t.data.email}
                    placeholder={t.data.placeholderEmail}
                    inputId="email"
                    inputName="email"
                    inputType="text"
                  />
                )}
              </changeDataForm.AppField>
              <Button text={t.data.updateButton} />
            </div>
          </changeDataForm.AppForm>
        </div>
        <Divider />
        <div className="flex flex-col gap-y-2">
          <div className="text-xl">{t.password.title}</div>
          <changePasswordForm.AppForm>
            <div className="flex flex-col gap-y-3">
              <changePasswordForm.AppField name="currentPassword">
                {(field) => (
                  <field.InputField
                    labelText={t.password.currentPassword}
                    placeholder={t.password.placeholderCurrentPassword}
                    inputId="currentPassword"
                    inputName="currentPassword"
                    inputType="password"
                  />
                )}
              </changePasswordForm.AppField>
              <div className="flex flex-row gap-x-4">
                <changePasswordForm.AppField name="newPassword">
                  {(field) => (
                    <field.InputField
                      labelText={t.password.password}
                      placeholder={t.password.placeholderPassword}
                      inputId="newPassword"
                      inputName="newPassword"
                      inputType="password"
                    />
                  )}
                </changePasswordForm.AppField>
                <changePasswordForm.AppField name="confirmNewPassword">
                  {(field) => (
                    <field.InputField
                      labelText={t.password.confirmPassword}
                      placeholder={t.password.placeholderConfirmPassword}
                      inputId="confirmNewPassword"
                      inputName="confirmNewPassword"
                      inputType="password"
                    />
                  )}
                </changePasswordForm.AppField>
              </div>
              <Button text={t.password.updateButton} />
            </div>
          </changePasswordForm.AppForm>
        </div>
        <Divider />

        <div className="flex flex-col gap-y-2">
          <div className="text-xl">{t.devices.title}</div>
          <div className="w-full">
            <table className="w-full text-center rounded-md overflow-hidden">
              <thead className="bg-(--color-background-primary) h-10 rounded-t-lg">
                <tr>
                  <th>{t.devices.platform}</th>
                  <th>{t.devices.createdAt}</th>
                  <th>{t.devices.lastUsed}</th>
                  <th>{t.devices.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data?.logins.map((login, index) => (
                  <tr
                    className="even:bg-(--color-background-selected)"
                    key={index}
                  >
                    <td>
                      {login.platformName.includes("Mac OS")
                        ? "MacOS"
                        : login.platformName.includes("Windows")
                          ? "Windows"
                          : login.platformName.includes("Linux")
                            ? "Linux"
                            : login.platformName}
                    </td>
                    <td>
                      {moment(login.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                    </td>
                    <td>
                      {moment(login.lastUsed).format("YYYY-MM-DD HH:mm:ss")}
                    </td>
                    <td className="flex flex-row justify-center items-center gap-x-2 h-10">
                      <div
                        className="bg-(--color-button-delete) color-(--color-button-delete-foreground) hover:bg-(--color-button-delete-hover) hover:color-(--color-button-delete-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          removeDevice(login.id);
                        }}
                      >
                        {t.devices.removeButton}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}></td>
                  <td className="flex flex-row justify-center items-center gap-x-2 h-10">
                    <div
                      className="w-fit bg-(--color-button-delete) color-(--color-button-delete-foreground) hover:bg-(--color-button-delete-hover) hover:color-(--color-button-delete-foreground-hover) cursor-pointer px-2 py-1 rounded mt-2 text-center"
                      onClick={() => {
                        removeAllDevices();
                      }}
                    >
                      {t.devices.removeAllButton}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
