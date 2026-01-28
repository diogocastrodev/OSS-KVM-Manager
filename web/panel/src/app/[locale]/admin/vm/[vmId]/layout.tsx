import VMNavbarAdmin from "@/components/vm/navbar/navbarAdmin";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { dehydrate, HydrationBoundary, QueryClient, useQuery } from "@tanstack/react-query";

export default async function PanelLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    vmId: string
  }>
}) {
    const { vmId } = await params;

    const queryClient = new QueryClient()

    await queryClient.prefetchQuery({
      queryKey: [`getVMById-`+parseInt(vmId)],
        queryFn: async () => {
            const d = await apiFetchServer(`/api/v1/admin/vms/${vmId}`)
            return d.json()
        }})

    return (
        <>
          <div className="flex flex-col gap-y-5 p-5 h-full">
            <HydrationBoundary state={dehydrate(queryClient)}>
              <VMNavbarAdmin publicId={parseInt(vmId)} />
            </HydrationBoundary>
              {children}
          </div>
        </>
      );

}