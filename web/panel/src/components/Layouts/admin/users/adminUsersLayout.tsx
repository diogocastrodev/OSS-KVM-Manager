"use client";

import { useDebouncedCallback } from "@/components/debounce/useDebounceFn";
import { useDebounceVal } from "@/components/debounce/useDebounceVal";
import Divider from "@/components/Divider/Divider";
import Button from "@/components/Form/Button/Button";
import ButtonNoForm from "@/components/Form/Button/ButtonNoForm";
import { useAppForm } from "@/components/Form/useAppForm";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import z from "zod";

interface props {}

type Role = "USER" | "ADMIN";

type Status = "ACTIVE" | "DEACTIVATED" | "PENDING";

type DeactivationReason =
  | "USER_REQUEST"
  | "TERMS_OF_SERVICE_VIOLATION"
  | "OTHER"
  | "";

export interface GetAllUsersResponse {
  users: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: Status;
    deactivationReason: DeactivationReason | null;
    createdAt: string;
    updatedAt: string;
  }[];
  total: number;
}

export default function AdminUsersLayout() {
  const [editingUser, setEditingUser] = useState<
    GetAllUsersResponse["users"][0] | null
  >(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounceVal(search, 500);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      qk.api.v1.admin.users.getByPage({ page, limit, search: debouncedSearch }),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch ?? "",
      });

      const res = await apiFetch(`/api/v1/admin/users?${params}`);
      return (await res.json()) as GetAllUsersResponse;
    },
    placeholderData: (prev) => prev,
  });

  const debouncedRefetch = useDebouncedCallback(() => {
    refetch();
  }, 500);

  useEffect(() => {
    debouncedRefetch();

    // optional but recommended: cancel pending call if deps change/unmount
    return () => debouncedRefetch.cancel();
  }, [debouncedSearch, page, limit, debouncedRefetch]);

  const createMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiFetch(`/api/v1/admin/users`, {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!res.ok) {
        toast("Failed to create user", {
          type: "error",
        });
        throw new Error("Failed to create user");
      }

      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast("User created successfully", {
        type: "success",
      });
    },
  });

  const createFormValidate = z.object({
    email: z.email(),
  });

  const createForm = useAppForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: createFormValidate,
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        email: value.email,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role: string;
      status: string;
      deactivationReason: DeactivationReason | null;
    }) => {
      const deactivationR =
        data.status === "DEACTIVATED"
          ? { deactivationReason: data.deactivationReason }
          : null;
      const res = await apiFetch(`/api/v1/admin/users/${editingUser?.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          ...deactivationR,
        }),
      });

      if (!res.ok) {
        toast("Failed to update user", {
          type: "error",
        });
        throw new Error("Failed to update user");
      }

      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast("User updated successfully", {
        type: "success",
      });
      setIsUpdateModalOpen(false);
    },
  });

  const updateFormValidate = z.object({
    name: z.string(),
    email: z.string(),
    role: z.string(),
    status: z.string(),
    deactivationReason: z.string(),
  });

  const updateForm = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      status: "",
      deactivationReason: "USER_REQUEST",
    },
    validators: {
      onSubmit: updateFormValidate,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        name: value.name,
        email: value.email,
        role: value.role.toUpperCase() as Role,
        status: value.status.toUpperCase() as Status,
        deactivationReason:
          value.deactivationReason.toUpperCase() as DeactivationReason | null,
      });
    },
  });

  const forceEmailVerificationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(
        `/api/v1/admin/users/${userId}/force-email-verification`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        toast("Failed to force email verification", {
          type: "error",
        });
        throw new Error("Failed to force email verification");
      }

      return res.json();
    },
    onSuccess: () => {
      toast("Email verification forced successfully", {
        type: "success",
      });
      refetch();
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="text-2xl">Users</div>
        <div className="text-xl">Create User</div>
        <div className="flex flex-row ">
          <createForm.AppForm>
            <div className="flex flex-row items-end gap-x-3">
              <createForm.AppField name="email">
                {(field) => (
                  <field.InputField
                    inputId="email"
                    labelText="Email"
                    inputName="email"
                    inputType="text"
                  />
                )}
              </createForm.AppField>
              <Button text="Create User" />
            </div>
          </createForm.AppForm>
        </div>
        <Divider />
        <div className="text-xl">List of Users</div>
        <div className="flex flex-col gap-y-1">
          <div className="w-full flex flex-row items-center">
            <input
              type="text"
              placeholder="Search..."
              className="px-2 w-64 py-1 focus:outline-1 focus:outline-(--color-button-outline-focus) outline-1 outline-(--color-button-outline) rounded"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
            <div className="ml-auto flex flex-row items-center">
              <div className="bg-(--color-background-primary) px-2 py-1 rounded">
                <select
                  name=""
                  id=""
                  className="focus:outline-0"
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  value={limit}
                >
                  {/* <option value="2">2</option> */}
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="w-24 flex flex-row items-center gap-x-1 ml-4 bg-(--color-background-primary) px-2 rounded">
                Page:
                <input
                  type="number"
                  className="w-10 px-2 py-1 rounded focus:outline-(--color-background-selected)"
                  onChange={(e) => setPage(parseInt(e.target.value))}
                  value={page}
                  min={1}
                  max={Math.ceil((data?.total ?? 1) / limit)}
                />
              </div>
              <div className="flex flex-row items-center gap-x-2 ml-4 bg-(--color-background-primary) px-2 py-1 rounded">
                <div className="">
                  <ArrowLeft
                    className="cursor-pointer"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  />
                </div>
                <div className="">
                  <ArrowRight
                    className="cursor-pointer"
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil((data?.total ?? 1) / limit),
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <table className="w-full text-center rounded-md overflow-hidden">
            <thead className="bg-(--color-background-primary) h-10 rounded-t-lg">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-4">
                    <div className="flex flex-row justify-center">
                      <Loader />
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading &&
                data &&
                data.users.length > 0 &&
                data.users.map((subUser, index: number) => (
                  <tr
                    className="even:bg-(--color-background-selected)"
                    key={index}
                  >
                    <td>{subUser.name}</td>
                    <td>{subUser.email}</td>
                    <td className="capitalize">{subUser.role.toLowerCase()}</td>
                    <td className="capitalize">
                      {subUser.status.toLowerCase()}
                    </td>
                    <td className="flex flex-row justify-center items-center gap-x-2 h-10">
                      <div
                        className="bg-(--color-button-update) color-(--color-button-update-foreground) hover:bg-(--color-button-update-hover) hover:color-(--color-button-update-foreground-hover) cursor-pointer px-2 py-1 rounded"
                        onClick={() => {
                          setEditingUser(subUser);
                          updateForm.setFieldValue("name", subUser.name);
                          updateForm.setFieldValue("email", subUser.email);
                          updateForm.setFieldValue("role", subUser.role);
                          updateForm.setFieldValue("status", subUser.status);
                          updateForm.setFieldValue(
                            "deactivationReason",
                            subUser.deactivationReason ?? "USER_REQUEST",
                          );
                          setIsUpdateModalOpen(true);
                        }}
                      >
                        Update
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="ml-auto pt-2 pr-1">
            {!isLoading && data && data.users.length > 0 && (
              <div>
                Total: {data.users.length} / {data.total}
              </div>
            )}
          </div>
        </div>
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          data={{
            title: "Update User",
            content: editingUser ? (
              <updateForm.AppForm>
                <div className="flex flex-col gap-y-2">
                  <updateForm.AppField name="name">
                    {(field) => (
                      <field.InputField
                        inputId="name"
                        labelText="Name"
                        inputName="name"
                        inputType="text"
                      />
                    )}
                  </updateForm.AppField>
                  <updateForm.AppField name="email">
                    {(field) => (
                      <field.InputField
                        inputId="email"
                        labelText="Email"
                        inputName="email"
                        inputType="text"
                      />
                    )}
                  </updateForm.AppField>
                  <updateForm.AppField name="role">
                    {(field) => (
                      <field.SelectField
                        inputId="role"
                        labelText="Role"
                        inputName="role"
                        options={[
                          {
                            label: "User",
                            value: "USER",
                          },
                          {
                            label: "Admin",
                            value: "ADMIN",
                          },
                        ]}
                      />
                    )}
                  </updateForm.AppField>
                  <div className="flex flex-row gap-x-3">
                    <updateForm.AppField name="status">
                      {(statusField) => {
                        const status = statusField.state.value as Status;
                        const originalWasPending =
                          editingUser?.status === "PENDING";

                        const options =
                          originalWasPending && status === "PENDING"
                            ? [{ label: "Pending", value: "PENDING" as const }]
                            : [
                                { label: "Active", value: "ACTIVE" as const },
                                {
                                  label: "Deactivated",
                                  value: "DEACTIVATED" as const,
                                },
                              ];
                        return (
                          <>
                            <div className="flex flex-row gap-x-3">
                              <statusField.SelectField
                                inputId="status"
                                labelText="Status"
                                inputName="status"
                                options={options}
                              />

                              {originalWasPending && status === "PENDING" && (
                                <div className="flex items-end">
                                  <ButtonNoForm
                                    button={{
                                      onClick: () => {
                                        forceEmailVerificationMutation.mutate(
                                          editingUser.id,
                                        );
                                        updateForm.setFieldValue(
                                          "status",
                                          "ACTIVE",
                                        );
                                        updateForm.setFieldValue(
                                          "deactivationReason",
                                          "",
                                        );
                                      },
                                    }}
                                  >
                                    Fake Confirm Email
                                  </ButtonNoForm>
                                </div>
                              )}
                            </div>

                            {statusField.state.value === "DEACTIVATED" && (
                              <>
                                <Divider />
                                <updateForm.AppField name="deactivationReason">
                                  {(field) => (
                                    <field.SelectField
                                      inputId="deactivationReason"
                                      labelText="Deactivation Reason"
                                      inputName="deactivationReason"
                                      options={[
                                        {
                                          label: "User Request",
                                          value: "USER_REQUEST",
                                        },
                                        {
                                          label: "Terms of Service Violation",
                                          value: "TERMS_OF_SERVICE_VIOLATION",
                                        },
                                        { label: "Other", value: "OTHER" },
                                      ]}
                                    />
                                  )}
                                </updateForm.AppField>
                              </>
                            )}
                          </>
                        );
                      }}
                    </updateForm.AppField>

                    {/*  */}
                  </div>
                  {status === "DEACTIVATED" && (
                    <>
                      <Divider />
                      <updateForm.AppField name="deactivationReason">
                        {(field) => (
                          <field.SelectField
                            inputId="deactivationReason"
                            labelText="Deactivation Reason"
                            inputName="deactivationReason"
                            options={[
                              { label: "User Request", value: "USER_REQUEST" },
                              {
                                label: "Terms of Service Violation",
                                value: "TERMS_OF_SERVICE_VIOLATION",
                              },
                              { label: "Other", value: "OTHER" },
                            ]}
                          />
                        )}
                      </updateForm.AppField>
                    </>
                  )}
                  <Button text="Update User" />
                </div>
              </updateForm.AppForm>
            ) : null,
          }}
        />
      </div>
    </>
  );
}
