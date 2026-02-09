import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMSubUsers, { GetAllUsersResponse } from "./vmSubUsers";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { getTranslations } from "next-intl/server";

type Params = { locale: string; vmId: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
  const { vmId } = await params;
  const t = await getTranslations("panel-vm.subuser-page");
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: [qk.api.v1.vms.subUsers.getAllSubUsers(Number(vmId))],
    queryFn: async () =>
      (await apiFetchServer(`/api/v1/vms/${vmId}/subusers`)).json() as Promise<
        GetAllUsersResponse[]
      >,
    staleTime: 60_000,
  });
  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <VMSubUsers
          vmID={vmId}
          translations={{
            add: {
              addButton: t("add.add-button"),
              email: t("add.email"),
              invalidEmail: t("add.invalid-email"),
              placeholderEmail: t("add.placeholder-email"),
              title: t("add.title"),
              toast: {
                success: t("add.toast.success"),
                error: t("add.toast.error"),
              },
            },
            role: t("role"),
            roleError: t("role-error"),
            roles: {
              viewer: t("roles.viewer"),
              operator: t("roles.operator"),
              owner: t("roles.owner"),
            },
            list: {
              title: t("list.title"),
              name: t("list.name"),
              email: t("list.email"),
              role: t("list.role"),
              actions: t("list.actions"),
            },
            update: {
              button: t("update.button"),
              modal: {
                title: t("update.modal.title"),
                button: t("update.modal.button"),
              },
              toast: {
                success: t("update.toast.success"),
                error: t("update.toast.error"),
              },
            },
            remove: {
              button: t("remove.button"),
              toast: {
                success: t("remove.toast.success"),
                error: t("remove.toast.error"),
              },
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
