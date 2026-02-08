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
import { z } from "zod";

interface props {
  vmID: string;
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

export default function VMSubUsers({ vmID }: props) {
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
      message: "Role must be operator or viewer",
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
        refetchSubUsers();
      });
    },
    onError: (error) => {
      console.error("Error creating sub-user:", error);
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
      message: "Role must be operator or viewer",
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
        refetchSubUsers();
      });
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <createSubUserForm.AppForm>
          <div className="flex flex-col">
            <div className="text-2xl">Add Sub User</div>
            <div className="flex flex-col gap-y-4 mt-2 ml-2">
              <createSubUserForm.AppField name="email">
                {(field) => (
                  <field.InputField
                    inputId="email"
                    inputType="text"
                    inputName="email"
                    labelText="Email:"
                  />
                )}
              </createSubUserForm.AppField>
              <createSubUserForm.AppField name="role">
                {(field) => (
                  <field.SelectField
                    inputId="role"
                    inputName="role"
                    labelText="Role:"
                    options={[
                      { value: "viewer", label: "Viewer" },
                      { value: "operator", label: "Operator" },
                    ]}
                  />
                )}
              </createSubUserForm.AppField>
              {/* <Button text="Add Sub User" /> */}
              <Button text="Add Sub User" />
            </div>
          </div>
        </createSubUserForm.AppForm>
        <Divider />

        <div className="flex flex-col w-full gap-y-3">
          <div className="text-2xl">Sub Users</div>
          <table className="w-full text-center rounded-md overflow-hidden">
            <thead className="bg-(--color-background-primary) h-10 rounded-t-lg">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="w-64">Actions</th>
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
                      {subUser.subUserRole.toLowerCase()}
                    </td>
                    <td className="flex flex-row justify-center items-center gap-x-2 h-10">
                      <div
                        className="bg-(--color-button-update) color-(--color-button-update-foreground) hover:bg-(--color-button-update-hover) hover:color-(--color-button-update-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          setEditingUser(subUser);
                          setIsUpdateModalOpen(true);
                        }}
                      >
                        Update
                      </div>
                      <div
                        className="bg-(--color-button-delete) color-(--color-button-delete-foreground) hover:bg-(--color-button-delete-hover) hover:color-(--color-button-delete-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          deleteUser.mutateAsync(subUser.subUserId);
                        }}
                      >
                        Delete
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
            title: "Update Sub User",
            content: editingUser ? (
              <div className="flex flex-col gap-y-2">
                <updateUserForm.AppForm>
                  <updateUserForm.AppField name="role">
                    {(field) => (
                      <field.SelectField
                        inputId="role"
                        inputName="role"
                        labelText="Role:"
                        options={[
                          { value: "viewer", label: "Viewer" },
                          { value: "operator", label: "Operator" },
                        ]}
                        selectedValue={editingUser.subUserRole.toLowerCase()}
                      />
                    )}
                  </updateUserForm.AppField>
                  <div className="flex flex-row justify-end">
                    <Button
                      text="Update User"
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
