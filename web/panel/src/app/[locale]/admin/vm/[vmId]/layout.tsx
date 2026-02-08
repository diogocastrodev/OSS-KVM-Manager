import VMNavbarAdmin from "@/components/vm/navbar/navbarAdmin";
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
    vmId: string;
    locale: string;
  }>;
}) {
  const { vmId } = await params;
  const t = await getTranslations("panel-vm.navbar");

  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: qk.api.v1.admin.vms.getById(parseInt(vmId)),
    queryFn: async () => {
      try {
        const d = await apiFetchServer(
          `/api/v1/admin/vms/${vmId}?include_server=true`,
        );
        if (!d.ok) notFound();
        return d.json() as Promise<UserGetVMByIDResponse>;
      } catch {
        notFound();
      }
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-5 h-full">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <VMNavbarAdmin
            publicId={parseInt(vmId)}
            translations={{
              navbar: {
                dashboard: t("dashboard"),
                console: t("console"),
                reset: t("reset"),
                subusers: t("subusers"),
                settings: t("settings"),
              },
            }}
          />
          {children}
        </HydrationBoundary>
      </div>
    </>
  );
}
