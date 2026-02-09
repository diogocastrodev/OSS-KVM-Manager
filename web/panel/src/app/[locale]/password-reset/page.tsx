import { getTranslations } from "next-intl/server";
import PasswordReset from "./PasswordReset";
import { notFound } from "next/navigation";
import { apiFetchServer } from "@/lib/apiFetchServer";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("passwordReset");

  const token = (await searchParams).token as string;

  const res = await apiFetchServer(`/api/v1/auth/password-reset/${token}`);

  if (!res.ok) {
    notFound();
  }

  return (
    <>
      <PasswordReset
        translation={{
          toast: {
            success: t("toast.success"),
            error: t("toast.error"),
          },
          password: t("password"),
          invalidPassword: t("invalidPassword"),
          placeholderPassword: t("placeholderPassword"),
          confirmPassword: t("confirmPassword"),
          invalidConfirmPassword: t("invalidConfirmPassword"),
          placeholderConfirmPassword: t("placeholderConfirmPassword"),
          resetPassword: t("resetPassword"),
        }}
      />
    </>
  );
}
