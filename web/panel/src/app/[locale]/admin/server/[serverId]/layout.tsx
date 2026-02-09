import VMNavbarAdminServer, {
  ServerData,
} from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("admin.server-page.nav");

  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: [qk.api.v1.admin.servers.getById(parseInt(serverId))],
    queryFn: async () => {
      const d = await apiFetchServer(`/api/v1/admin/servers/${serverId}`);
      if (d.status === 404) {
        notFound();
      }
      return d.json() as Promise<ServerData>;
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-5 h-full">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <VMNavbarAdminServer
            publicId={parseInt(serverId)}
            translations={{
              dashboard: t("dashboard"),
              virtualmachines: t("virtual-machines"),
              virtualmachinessubnav: {
                listvms: t("virtual-machines-subnav.list-vms"),
                createvm: t("virtual-machines-subnav.create-vm"),
              },
              settings: t("settings"),
            }}
          />
          {children}
        </HydrationBoundary>
      </div>
    </>
  );
}
