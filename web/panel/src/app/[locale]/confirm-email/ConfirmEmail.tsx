"use client";
import { apiFetch } from "@/lib/apiFetch";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@/components/Form/useAppForm";
import Button from "@/components/Form/Button/Button";
import Logo from "@/components/Icon/Logo";
import { useMutation, useQuery } from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";

interface ConfirmEmailProps {
  translation: {
    name: string;
    password: string;
    confirmPassword: string;
    buttonText: string;
  };
}
export default function ConfirmEmail({ translation: t }: ConfirmEmailProps) {
  const token = useSearchParams().get("token");
  const router = useRouter();

  const requestUpdatePassword = useMutation({
    mutationKey: qk.api.v1.auth.confirmEmail(),
    mutationFn: async (data: { name: string; password: string }) => {
      try {
        const res = await apiFetch("/api/v1/auth/confirm-email", {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            password: data.password,
            token: token,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        router.replace("/");
        router.refresh();
      } catch (error) {
        console.error("Update failed:", error);
      }
    },
  });
  const formSchema = z.object({
    name: z.string().min(1, { message: "Invalid name" }),
    password: z.string().min(8, { message: "Invalid password" }),
    confPassword: z.string().min(8, { message: "Invalid password" }),
  });
  const form = useAppForm({
    defaultValues: {
      name: "",
      password: "",
      confPassword: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confPassword) {
        // TODO: Handle Error
        return;
      }
      await requestUpdatePassword.mutateAsync({
        name: value.name,
        password: value.password,
      });
    },
  });

  return (
    <>
      <div className="flex-1 flex justify-center items-center">
        <div className="w-92 h-96 bg-(--color-background-selected) rounded-lg p-2 flex flex-col justify-center items-center gap-4">
          <div>
            <Logo
              props={{
                className: `w-14`,
              }}
            />
          </div>
          <form.AppForm>
            <form
              action=""
              className="flex flex-col gap-4 justify-center items-center"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="flex flex-col">
                <form.AppField name="name">
                  {(field) => (
                    <field.InputField
                      labelText={t.name}
                      inputType="text"
                      inputName="name"
                      inputId="name"
                    />
                  )}
                </form.AppField>
              </div>
              <div className="flex flex-col">
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
              </div>
              <div className="flex flex-col">
                <form.AppField name="confPassword">
                  {(field) => (
                    <field.InputField
                      labelText={t.confirmPassword}
                      inputType="password"
                      inputName="confPassword"
                      inputId="confPassword"
                    />
                  )}
                </form.AppField>
              </div>
              <Button text={t.buttonText}></Button>
            </form>
          </form.AppForm>
        </div>
      </div>
    </>
  );
}
