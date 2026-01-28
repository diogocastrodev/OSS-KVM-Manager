import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import PanelLayout from "@/components/Layouts/Panel/PanelLayout";
import { myVMsResponse } from "@/lib/fetches/fetchMyVMs";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PanelLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: qk.api.v1.server.myServers(),
    queryFn: async () =>
      (
        await apiFetchServer("/api/v1/servers?include_virtual_machines=true")
      ).json() as Promise<myVMsResponse>,
    staleTime: 60_000,
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <PanelLayout>{children}</PanelLayout>
      </HydrationBoundary>
    </>
  );
}
