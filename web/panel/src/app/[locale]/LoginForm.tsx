"use client";
import { apiFetch } from "@/lib/apiFetch";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter as useRouterLang, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useAppForm } from "@/components/Form/useAppForm";
import Button from "@/components/Form/Button/Button";
import Logo from "@/components/Icon/Logo";
import { useMutation } from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";

interface LoginFormProps {
  translation: {
    username: string;
    password: string;
    forgotPassword: string;
    login: string;
  };
}
export default function LoginForm({ translation: t }: LoginFormProps) {
  const sendLoginRequest = useMutation({
    mutationKey: qk.api.v1.auth.login(),
    mutationFn: async (data: { email: string; password: string }) => {
      try {
        const res = await apiFetch("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: data.email, password: data.password }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Login successful:", res);
        // await queryClient.invalidateQueries({ queryKey: ["session"] });

        router.replace("/panel");
        router.refresh();
        // Handle successful login (e.g., redirect, show message, etc.)
      } catch (error) {
        console.error("Login failed:", error);
        // Handle login error (e.g., show error message)
      }
    },
  });
  const router = useRouter();
  const formSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Invalid password" }),
  });
  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await sendLoginRequest.mutateAsync({
        email: value.email,
        password: value.password,
      });
    },
  });

  const logout = async () => {
    await apiFetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.refresh();
  };

  useEffect(() => {
    fetch("/api/session", { credentials: "include" });
  }, []);

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
                      labelText={t.username}
                      inputType="text"
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
              <div className="flex flex-col">
                <form.AppField name="password">
                  {(field) => (
                    <field.InputField
                      labelText={t.password}
                      inputType="password"
                      inputName="password"
                      inputId="password"
                    >
                      <a
                        href="#"
                        className="text-sm text-(--color-anchor) mt-1 hover:text-(--color-anchor-hover) transition-colors"
                      >
                        {t.forgotPassword}
                      </a>
                    </field.InputField>
                  )}
                </form.AppField>
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
              </div>
              <Button text={t.login}></Button>
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
