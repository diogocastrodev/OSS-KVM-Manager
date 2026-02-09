"use client";

import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { z } from "zod";

interface props {
  vmID: string;
  translations: {
    add: {
      toast: {
        success: string;
        error: string;
      };
      title: string;
      email: string;
      invalidEmail: string;
      placeholderEmail: string;
      addButton: string;
    };
    role: string;
    roleError: string;
    roles: {
      viewer: string;
      operator: string;
      owner: string;
    };
    list: {
      title: string;
      name: string;
      email: string;
      role: string;
      actions: string;
    };
    update: {
      toast: {
        success: string;
        error: string;
      };
      button: string;
      modal: {
        title: string;
        button: string;
      };
    };
    remove: {
      button: string;
      toast: {
        success: string;
        error: string;
      };
    };
  };
}

type Role = "operator" | "viewer";

interface SubUser {
  email: string;
  role: "operator" | "viewer";
}

export interface GetAllUsersResponse {
  subUserId: string;
  subUserName: string;
  subUserEmail: string;
  subUserRole: Role;
}

export default function VMSubUsers({ vmID, translations: t }: props) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GetAllUsersResponse | null>(
    null,
  );

  const {
    data,
    isLoading,
    refetch: refetchSubUsers,
  } = useQuery({
    queryKey: [qk.api.v1.vms.subUsers.getAllSubUsers(Number(vmID))],
    queryFn: async () =>
      (await apiFetch(`/api/v1/vms/${vmID}/subusers`)).json() as Promise<
        GetAllUsersResponse[]
      >,
  });

  const createSubUserSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    role: z.enum(["operator", "viewer"], {
      message: t.roleError,
    }),
  });

  const createSubUser = useMutation({
    mutationKey: [qk.api.v1.vms.subUsers.createSubUser(Number(vmID))],
    mutationFn: async (data: z.infer<typeof createSubUserSchema>) => {
      return apiFetch(`/api/v1/vms/${vmID}/subusers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          role: data.role,
        }),
      }).then(() => {
        toast.success(t.add.toast.success);
        refetchSubUsers();
      });
    },
    onError: (error) => {
      console.error("Error creating sub-user:", error);
      toast.error(t.add.toast.error);
    },
  });

  const createSubUserForm = useAppForm({
    defaultValues: {
      email: "",
      role: "viewer" as Role,
    },
    validators: {
      onSubmit: createSubUserSchema,
    },
    onSubmit: async ({ value }) => {
      await createSubUser.mutateAsync({
        email: value.email,
        role: value.role as Role,
      });
    },
  });

  const updateUserSchema = z.object({
    subUserId: z.string(),
    role: z.enum(["operator", "viewer"], {
      message: t.roleError,
    }),
  });

  const updateUser = useMutation({
    mutationKey: [qk.api.v1.vms.subUsers.updateSubUser(Number(vmID))],
    mutationFn: async (data: z.infer<typeof updateUserSchema>) => {
      return apiFetch(`/api/v1/vms/${vmID}/subusers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subUserId: data.subUserId,
          role: data.role,
        }),
      }).then(() => {
        toast.success(t.update.toast.success);
        refetchSubUsers();
      });
    },
  });

  const updateUserForm = useAppForm({
    defaultValues: {
      subUserId: "",
      role: "viewer" as Role,
    },
    validators: {
      onSubmit: updateUserSchema,
    },
    onSubmit: async ({ value }) => {
      await updateUser.mutateAsync({
        subUserId: editingUser ? editingUser.subUserId : "",
        role: value.role as Role,
      });
    },
  });

  const deleteUser = useMutation({
    mutationKey: [qk.api.v1.vms.subUsers.deleteSubUser(Number(vmID))],
    mutationFn: async (subUserId: string) => {
      return apiFetch(`/api/v1/vms/${vmID}/subusers`, {
        method: "DELETE",
        body: JSON.stringify({ subUserId }),
      }).then(() => {
        toast.success(t.remove.toast.success);
        refetchSubUsers();
      });
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <createSubUserForm.AppForm>
          <div className="flex flex-col">
            <div className="text-2xl">{t.add.title}</div>
            <div className="flex flex-col gap-y-4 mt-2 ml-2">
              <createSubUserForm.AppField name="email">
                {(field) => (
                  <field.InputField
                    inputId="email"
                    inputType="text"
                    inputName="email"
                    placeholder={t.add.placeholderEmail}
                    labelText={t.add.email}
                  />
                )}
              </createSubUserForm.AppField>
              <createSubUserForm.AppField name="role">
                {(field) => (
                  <field.SelectField
                    inputId="role"
                    inputName="role"
                    labelText={t.role}
                    options={[
                      { value: "viewer", label: t.roles.viewer },
                      { value: "operator", label: t.roles.operator },
                    ]}
                  />
                )}
              </createSubUserForm.AppField>
              {/* <Button text="Add Sub User" /> */}
              <Button text={t.add.addButton} />
            </div>
          </div>
        </createSubUserForm.AppForm>
        <Divider />

        <div className="flex flex-col w-full gap-y-3">
          <div className="text-2xl">{t.list.title}</div>
          <table className="w-full text-center rounded-md overflow-hidden">
            <thead className="bg-(--color-background-primary) h-10 rounded-t-lg">
              <tr>
                <th>{t.list.name}</th>
                <th>{t.list.email}</th>
                <th>{t.list.role}</th>
                <th className="w-64">{t.list.actions}</th>
              </tr>
            </thead>
            <tbody className="">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-4">
                    <div className="flex flex-row justify-center">
                      <Loader />
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading &&
                data &&
                data.length > 0 &&
                data.map((subUser: GetAllUsersResponse, index: number) => (
                  <tr
                    className="even:bg-(--color-background-selected)"
                    key={index}
                  >
                    <td>{subUser.subUserName}</td>
                    <td>{subUser.subUserEmail}</td>
                    <td className="capitalize">
                      {
                        t.roles[
                          subUser.subUserRole.toLowerCase() as keyof typeof t.roles
                        ]
                      }
                    </td>
                    <td className="flex flex-row justify-center items-center gap-x-2 h-10">
                      <div
                        className="bg-(--color-button-update) color-(--color-button-update-foreground) hover:bg-(--color-button-update-hover) hover:color-(--color-button-update-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          setEditingUser(subUser);
                          setIsUpdateModalOpen(true);
                        }}
                      >
                        {t.update.button}
                      </div>
                      <div
                        className="bg-(--color-button-delete) color-(--color-button-delete-foreground) hover:bg-(--color-button-delete-hover) hover:color-(--color-button-delete-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          deleteUser.mutateAsync(subUser.subUserId);
                        }}
                      >
                        {t.remove.button}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          data={{
            title: t.update.modal.title,
            content: editingUser ? (
              <div className="flex flex-col gap-y-2">
                <updateUserForm.AppForm>
                  <updateUserForm.AppField name="role">
                    {(field) => (
                      <field.SelectField
                        inputId="role"
                        inputName="role"
                        labelText={t.role}
                        options={[
                          { value: "viewer", label: t.roles.viewer },
                          { value: "operator", label: t.roles.operator },
                        ]}
                        selectedValue={editingUser.subUserRole.toLowerCase()}
                      />
                    )}
                  </updateUserForm.AppField>
                  <div className="flex flex-row justify-end">
                    <Button
                      text={t.update.button}
                      className="bg-(--color-button-update) outline-0 border-0 color-(--color-button-update-foreground) hover:bg-(--color-button-update-hover) hover:color-(--color-button-update-foreground-hover) px-4 py-2 rounded"
                    />
                  </div>
                </updateUserForm.AppForm>
              </div>
            ) : null,
          }}
        />
      </div>
    </>
  );
}
