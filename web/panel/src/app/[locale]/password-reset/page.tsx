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
          password: t("password"),
          confirmPassword: t("confirmPassword"),
          resetPassword: t("resetPassword"),
        }}
      />
    </>
  );
}
