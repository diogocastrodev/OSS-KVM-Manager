import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";
import AdminLayout from "@components/Layouts/admin/adminLayout";
import { Session } from "@/types/Session";
import { notFound } from "next/navigation";

export interface AdminServersResponse {
  servers: {
    publicId: number;
    name: string;
    virtual_machines: {
      publicId: number;
      name: string;
      status: string;
    }[];
  }[];
}

export default async function PanelLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: qk.api.v1.user.session(),
    queryFn: async () => {
      try {
        const d = await apiFetchServer("/api/v1/user/session");
        if (!d.ok) return null;
        const da = (await d.json()).user as Session;
        if (da?.role !== "ADMIN") {
          notFound();
        }
        return da;
      } catch (e) {
        return null;
      }
    },
  });
  await qc.fetchQuery({
    queryKey: qk.api.v1.admin.servers.all(),
    queryFn: async () =>
      await apiFetchServer(
        "/api/v1/admin/servers?include_virtual_machines=true",
      ).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch servers");
        }
        return res.json() as Promise<AdminServersResponse>;
      }),
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <AdminLayout>{children}</AdminLayout>
      </HydrationBoundary>
    </>
  );
}
