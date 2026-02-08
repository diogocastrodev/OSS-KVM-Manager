import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMFormat from "./vmFormat";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";

type Params = { locale: string; vmId: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
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
        <VMFormat vmID={vmId} />
      </HydrationBoundary>
    </>
  );
}
