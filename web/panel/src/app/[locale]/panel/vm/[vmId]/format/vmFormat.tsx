"use client";

import Button from "@/components/Form/Button/Button";
import { useAppForm } from "@/components/Form/useAppForm";
import VMNavbar from "@/components/vm/navbar/navbar";
import { apiFetch } from "@/lib/apiFetch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import z from "zod";

interface props {
  vmID: string;
}

export default function VMFormat({ vmID }: props) {
  const mutation = useMutation({
    mutationFn: async (data: {
      hostname: string;
      username: string;
      password?: string;
      publicKey?: string;
    }) => {
      return apiFetch(`/vms/${vmID}/format`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
  const [selectedOption, setSelectedOption] = useState<
    "password" | "publicKey"
  >("password");
  const validate = z
    .object({
      hostname: z.string().min(3, "Hostname must be at least 3 characters"),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .optional(),
      confirmPassword: z
        .string()
        .min(8, "Confirm Password must be at least 8 characters")
        .optional(),
      publicKey: z.string().optional(),
    })
    .refine(
      (data) => {
        if (selectedOption === "password") {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: "Passwords do not match",
      },
    );
  const form = useAppForm({
    defaultValues: {
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
    onSubmit: async (data) => {
      mutation.mutate(data);
    },
  });

  return (
    <>
      <form.AppForm>
        <form action="" className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <div className="text-xl">Choose your Image:</div>
            <div className="flex flex-col pl-3 gap-y-2">
              <div className="flex flex-row">
                <span>Operative System: </span>
                <select name="" id="">
                  <option value="">Ubuntu</option>
                </select>
              </div>
              <div className="flex flex-row">
                <span>Version: </span>
                <select name="" id="">
                  <option value="">24.04</option>
                </select>
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

            <div className="">
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
                <div
                  className={`${selectedOption === "publicKey" ? "bg-(--color-background-selected) cursor-not-allowed" : "bg-(--color-background-primary) cursor-pointer"} rounded-md shadow-lg p-2`}
                  onClick={() => setSelectedOption("publicKey")}
                >
                  Public Key
                </div>
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
            </div>
            <Button text="Format" />
          </div>
        </form>
      </form.AppForm>
    </>
  );
}
