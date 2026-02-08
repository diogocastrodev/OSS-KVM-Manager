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

export default async function AdminUsersLayoutPage() {
  const qc = new QueryClient();

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
        <AdminUsersLayout />
      </HydrationBoundary>
    </>
  );
}
