import qk from "@/lib/fetches/keys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import AdminPage, { AdminServerHealthResponse } from "./AdminPage";
import { apiFetchServer } from "@/lib/apiFetchServer";

export default async function Page() {
  const qc = new QueryClient();
  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.servers.allHealth()],
    queryFn: async () => {
      const res = await apiFetchServer("/api/v1/admin/servers/health");
      if (!res.ok) {
        throw new Error("Failed to fetch server health");
      }
      return res.json() as Promise<AdminServerHealthResponse>;
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <AdminPage />
      </HydrationBoundary>
    </>
  );
}
