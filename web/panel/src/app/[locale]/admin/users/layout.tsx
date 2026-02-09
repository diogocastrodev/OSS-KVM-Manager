import AdminUsersLayout, {
  GetAllUsersResponse,
} from "@/components/Layouts/admin/users/adminUsersLayout";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersLayoutPage() {
  const qc = new QueryClient();
  const t = await getTranslations("admin.users");

  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.users.getByPage({ page: 1, limit: 10 })],
    queryFn: async () => {
      const d = await apiFetchServer(`/api/v1/admin/users?page=1&limit=10`);
      return d.json() as Promise<GetAllUsersResponse>;
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <AdminUsersLayout
          translations={{
            title: t("title"),
            create: {
              title: t("create.title"),
              toast: {
                success: t("create.toast.success"),
                error: t("create.toast.error"),
              },
              email: t("create.email"),
              invalidEmail: t("create.invalid-email"),
              placeholderEmail: t("create.placeholder-email"),
              createButton: t("create.create-button"),
            },
            list: {
              title: t("list.title"),
              searchPlaceholder: t("list.search-placeholder"),
              page: t("list.page"),
              total: t("list.total"),
              name: t("list.name"),
              email: t("list.email"),
              role: t("list.role"),
              stat: t("list.stat"),
              actions: {
                title: t("list.actions.title"),
                update: t("list.actions.update"),
              },
              roles: {
                admin: t("list.roles.admin"),
                user: t("list.roles.user"),
              },
              status: {
                active: t("list.status.active"),
                deactivated: t("list.status.deactivated"),
                pending: t("list.status.pending"),
              },
            },
            update: {
              title: t("update.title"),
              name: t("update.name"),
              invalidName: t("update.invalid-name"),
              placeholderName: t("update.placeholder-name"),
              email: t("update.email"),
              invalidEmail: t("update.invalid-email"),
              placeholderEmail: t("update.placeholder-email"),
              role: t("update.role"),
              invalidRole: t("update.invalid-role"),
              status: t("update.status"),
              invalidStatus: t("update.invalid-status"),
              updateButton: t("update.update-button"),
              confirmEmailVerificationButton: t("update.fake-email-update"),
              deactivationReason: t("update.deactivation-reason"),
              deactivationReasons: {
                userRequest: t("update.deactivation-reasons.user-request"),
                termsOfServiceViolation: t(
                  "update.deactivation-reasons.terms-of-service-violation",
                ),
                other: t("update.deactivation-reasons.other"),
              },
              toast: {
                success: t("update.toast.success"),
                error: t("update.toast.error"),
                successEmailVerification: t(
                  "update.toast.success-email-update",
                ),
                errorEmailVerification: t("update.toast.error-email-update"),
              },
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
