import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMsSettings from "./VmsSettings";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import { notFound } from "next/navigation";

export default async function ServersSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; vmId: string }>;
}) {
  const { vmId } = await params;
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.vms.getById(parseInt(vmId))],
    queryFn: async () => {
      const d = await apiFetchServer(
        `/api/v1/admin/vms/${vmId}?include_server=true`,
      );
      if (!d.ok) {
        notFound();
      }
      return d.json() as Promise<AdminGetVMByIDResponse>;
    },
  });
  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <VMsSettings vmId={vmId} />
      </HydrationBoundary>
    </>
  );
}
