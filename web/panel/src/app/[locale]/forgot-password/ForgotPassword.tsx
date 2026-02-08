"use client";
import { apiFetch } from "@/lib/apiFetch";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAppForm } from "@/components/Form/useAppForm";
import Button from "@/components/Form/Button/Button";
import Logo from "@/components/Icon/Logo";
import { useMutation } from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";
import { toast } from "react-toastify";

interface ForgotPasswordProps {
  translation: {
    email: string;
    buttonText: string;
  };
}
export default function ForgotPassword({
  translation: t,
}: ForgotPasswordProps) {
  const requestUpdatePassword = useMutation({
    mutationKey: qk.api.v1.auth.requestPasswordReset(),
    mutationFn: async (data: { email: string }) => {
      try {
        const res = await apiFetch("/api/v1/auth/password-reset", {
          method: "POST",
          body: JSON.stringify({ email: data.email }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Password reset email sent! Check your inbox.");

        router.replace("/");
        router.refresh();
      } catch (error) {
        toast.error("Failed to send password reset email");
      }
    },
  });
  const router = useRouter();
  const formSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
  });
  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await requestUpdatePassword.mutateAsync({
        email: value.email,
      });
    },
  });

  return (
    <>
      {/* <div>{t("hey")}</div>
      <Link locale={"pt"} href={"/"}>
        Change to PT
      </Link>
      <Link locale={"en"} href={"/"}>
        Change to EN
      </Link> */}

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
                <form.AppField name="email">
                  {(field) => (
                    <field.InputField
                      labelText={t.email}
                      inputType="email"
                      inputName="email"
                      inputId="email"
                    />
                  )}
                </form.AppField>
                {/*
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <>
                      <label
                        className="text-gray-200 mb-1"
                        htmlFor={field.name}
                      >
                        {t.username}
                      </label>
                      <input
                        className="w-64 h-8 rounded-md bg-zinc-700 outline-0 outline-zinc-900 focus:outline-blue-700 text-gray-200 pl-2 focus:outline-1"
                        type="text"
                        name={field.name}
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <span>{field.state.meta.errors[0]?.message}</span>
                      )}
                    </>
                  );
                }}
              /> */}
              </div>
              {/* <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <>
                      <label
                        className="text-gray-200 mb-1"
                        htmlFor={field.name}
                      >
                        {t.password}
                      </label>
                      <input
                        className="w-64 h-8 rounded-md bg-zinc-700 outline-0 outline-zinc-900 focus:outline-blue-700 text-gray-200 pl-2 focus:outline-1"
                        type="password"
                        name={field.name}
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <span>{field.state.meta.errors[0]?.message}</span>
                      )}
                      <a
                        href="#"
                        className="text-sm text-zinc-400 mt-1 hover:text-blue-700 transition-colors"
                      >
                        {t.forgotPassword}
                      </a>
                    </>
                  );
                }}
              /> */}
              <a href="/">Voltar para o Login</a>
              <Button text={t.buttonText}></Button>
              {/* <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-32 h-10 outline-2 outline-zinc-900 rounded-md hover:outline-0 hover:bg-blue-700 transition-all cursor-pointer text-gray-200 disabled:outline-1 disabled:outline-red-700"
                >
                  {isSubmitting ? "..." : `${t.login}`}
                </button>
              )}
            /> */}
              {/* Testing purposes */}

              {/* <div onClick={logout}>Bye</div> */}
              {/* <select
                onChange={(e) =>
                  routerLang.replace(pathname, {
                    locale: e.target.value as any,
                  })
                }
                defaultValue={routing.defaultLocale}
              >
                {routing.locales.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>{" "} */}
              {/* <button className="w-32 h-10 outline-2 outline-zinc-900 rounded-md hover:outline-0 hover:bg-blue-700 transition-all cursor-pointer text-gray-200">
              {t("login")}
            </button> */}
            </form>
          </form.AppForm>
        </div>
      </div>
    </>
  );
}
