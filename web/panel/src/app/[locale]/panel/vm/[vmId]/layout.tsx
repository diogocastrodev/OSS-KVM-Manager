import VMNavbar from "@/components/vm/navbar/navbar";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
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
    vmId: string;
  }>;
}) {
  const { vmId } = await params;

  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: qk.api.v1.vms.getVMById(parseInt(vmId)),
    queryFn: async () => {
      try {
        const d = await apiFetchServer(`/api/v1/vms/${vmId}`);
        if (!d.ok) notFound();
        return d.json() as Promise<UserGetVMByIDResponse>;
      } catch {
        notFound();
      }
    },
  });

  return (
    <>
      <div className="flex flex-col gap-y-5 p-5 h-full">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <VMNavbar publicId={parseInt(vmId)} />
          {children}
        </HydrationBoundary>
      </div>
    </>
  );
}
