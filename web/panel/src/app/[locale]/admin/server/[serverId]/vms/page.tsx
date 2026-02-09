import Table from "@/components/Table/Table";
import ServerVMs, { getVMsOfServerReplyBodyType } from "./ServersVMs";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { getTranslations } from "next-intl/server";

export default async function ServerVMsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const qc = new QueryClient();
  const t = await getTranslations("admin.server-page.list-vms");

  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.servers.getVMs(Number(serverId))],
    queryFn: async () => {
      const d = await apiFetchServer(`/api/v1/admin/servers/${serverId}/vms`);
      return d.json() as Promise<getVMsOfServerReplyBodyType>;
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <ServerVMs
          serverId={Number(serverId)}
          translations={{
            title: t("title"),
            name: t("name"),
            stat: t("stat"),
            status: {
              operational: t("status.operational"),
              formatting: t("status.formatting"),
              deleting: t("status.deleting"),
              failed: t("status.failed"),
            },
            ips: t("ips"),
            resources: {
              title: t("resources.title"),
              vCPU: t("resources.vCPU"),
              memory: t("resources.memory"),
              disk: t("resources.disk"),
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
