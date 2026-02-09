import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import ProfilePage, { ProfilePageData } from "./ProfilePage";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const qc = new QueryClient();
  const t = await getTranslations("profile");

  await qc.fetchQuery({
    queryKey: [qk.api.v1.user.profile()],
    queryFn: async () => {
      return await apiFetchServer("/api/v1/user/profile").then(
        (res) => res.json() as Promise<ProfilePageData>,
      );
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <ProfilePage
          translations={{
            title: t("title"),
            data: {
              title: t("data.title"),
              name: t("data.name"),
              invalidName: t("data.invalid-name"),
              placeholderName: t("data.placeholder-name"),
              email: t("data.email"),
              invalidEmail: t("data.invalid-email"),
              placeholderEmail: t("data.placeholder-email"),
              updateButton: t("data.update-button"),
              toast: {
                success: t("data.toast.success"),
                error: t("data.toast.error"),
              },
            },
            password: {
              title: t("password.title"),
              currentPassword: t("password.current-password"),
              invalidCurrentPassword: t("password.invalid-current-password"),
              placeholderCurrentPassword: t(
                "password.placeholder-current-password",
              ),
              password: t("password.password"),
              invalidPassword: t("password.invalid-password"),
              placeholderPassword: t("password.placeholder-password"),
              confirmPassword: t("password.confirm-password"),
              invalidConfirmPassword: t("password.invalid-confirm-password"),
              placeholderConfirmPassword: t(
                "password.placeholder-confirm-password",
              ),
              updateButton: t("password.update-button"),
              toast: {
                success: t("password.toast.success"),
                error: t("password.toast.error"),
              },
            },
            devices: {
              title: t("devices.title"),
              platform: t("devices.platform"),
              createdAt: t("devices.created-at"),
              lastUsed: t("devices.last-used"),
              actions: t("devices.actions"),
              removeButton: t("devices.remove-button"),
              removeAllButton: t("devices.remove-all-button"),
              toast: {
                removeSuccess: t("devices.toast.remove-success"),
                removeError: t("devices.toast.remove-error"),
                removeAllSuccess: t("devices.toast.remove-all-success"),
                removeAllError: t("devices.toast.remove-all-error"),
              },
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
