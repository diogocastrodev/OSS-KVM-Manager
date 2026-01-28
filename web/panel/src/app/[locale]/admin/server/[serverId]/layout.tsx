import VMNavbarAdminServer from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchServer } from "@/lib/apiFetchServer";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";

export default async function PanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    serverId: string;
  }>;
}) {
  const { serverId } = await params;

  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: [`getVMById-` + parseInt(serverId)],
    queryFn: async () => {
      const d = await apiFetchServer(`/api/v1/admin/servers/${serverId}`);
      if (d.status === 404) {
        notFound();
      }
      return d.json();
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-5 p-5 h-full">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <VMNavbarAdminServer publicId={parseInt(serverId)} />
          {children}
        </HydrationBoundary>
      </div>
    </>
  );
}
