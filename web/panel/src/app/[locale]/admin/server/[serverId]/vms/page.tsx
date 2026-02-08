import Table from "@/components/Table/Table";
import ServerVMs, { getVMsOfServerReplyBodyType } from "./ServersVMs";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";

export default async function ServerVMsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const qc = new QueryClient();

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
        <ServerVMs serverId={Number(serverId)} />
      </HydrationBoundary>
    </>
  );
}
