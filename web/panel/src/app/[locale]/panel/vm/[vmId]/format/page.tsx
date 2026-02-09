import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMFormat from "./vmFormat";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import { getTranslations } from "next-intl/server";

type Params = { locale: string; vmId: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
  const t = await getTranslations("panel-vm.reset-page");
  const { vmId } = await params;

  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: [qk.api.v1.os.getAllOS()],
    queryFn: async () => (await apiFetchServer(`/api/v1/os`)).json(),
    staleTime: 60_000,
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <VMFormat
          vmID={vmId}
          translations={{
            toast: {
              success: t("toast.success"),
              error: t("toast.error"),
              already: t("toast.already"),
              pending: t("toast.pending"),
            },
            chooseImage: t("choose-image"),
            confirmPassword: t("confirm-password"),
            hostname: t("hostname"),
            inputOs: t("input-os"),
            inputOsVersion: t("input-os-version"),
            invalidConfirmPassword: t("invalid-confirm-password"),
            invalidHostname: t("invalid-hostname"),
            invalidPassword: t("invalid-password"),
            invalidUsername: t("invalid-username"),
            password: t("password"),
            username: t("username"),
            placeholderConfirmPassword: t("placeholder-confirm-password"),
            placeholderHostname: t("placeholder-hostname"),
            placeholderPassword: t("placeholder-password"),
            placeholderUsername: t("placeholder-username"),
            publicKey: t("public-key"),
            resetButton: t("reset-button"),
            yourCredentials: t("your-credentials"),
            yourCredentialsSubtext: t("your-credentials-subtext"),
          }}
        />
      </HydrationBoundary>
    </>
  );
}
