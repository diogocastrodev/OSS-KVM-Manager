import { getTranslations } from "next-intl/server";
import ConfirmEmail from "./ConfirmEmail";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Params {
  locale: string;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("confirm-email");

  const token = (await searchParams).token as string;

  const res = await apiFetchServer(`/api/v1/auth/confirm-email/${token}`);

  if (!res.ok) {
    notFound();
  }
  return (
    <>
      <ConfirmEmail
        translation={{
          name: t("name"),
          password: t("password"),
          confirmPassword: t("confirmPassword"),
          buttonText: t("buttonText"),
        }}
      />
    </>
  );
}
