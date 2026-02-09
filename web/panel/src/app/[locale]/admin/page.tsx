import qk from "@/lib/fetches/keys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import AdminPage, { AdminServerHealthResponse } from "./AdminPage";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const qc = new QueryClient();
  const t = await getTranslations("panel.main-admin");
  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.servers.allHealth()],
    queryFn: async () => {
      const res = await apiFetchServer("/api/v1/admin/servers/health");
      if (!res.ok) {
        console.error("Failed to fetch server health data");
      }
      return res.json() as Promise<AdminServerHealthResponse>;
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <AdminPage
          translations={{
            serverStatus: t("server-status"),
            virtualMachines: t("virtual-machines"),
            state: {
              active: t("state.active"),
              inactive: t("state.inactive"),
              maintenance: t("state.maintenance"),
            },
            status: {
              operational: t("status.operational"),
              notOperational: t("status.not-operational"),
              unknown: t("status.unknown"),
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
