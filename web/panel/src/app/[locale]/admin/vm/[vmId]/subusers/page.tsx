import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMSubUsers, { GetAllUsersResponse } from "./vmSubUsers";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";

type Params = { locale: string; vmId: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
  const { vmId } = await params;
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: [qk.api.v1.vms.subUsers.getAllSubUsers(Number(vmId))],
    queryFn: async () =>
      (
        await apiFetchServer(`/api/v1/admin/vms/${vmId}/subusers`)
      ).json() as Promise<GetAllUsersResponse[]>,
    staleTime: 60_000,
  });
  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <VMSubUsers vmID={vmId} />
      </HydrationBoundary>
    </>
  );
}
