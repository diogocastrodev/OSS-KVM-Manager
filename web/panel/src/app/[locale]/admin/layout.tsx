import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { myVMsResponse } from "@/lib/fetches/fetchMyVMs";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";
import AdminLayout from "../../../components/Layouts/admin/adminLayout";
import { Session } from "@/types/Session";
import { notFound } from "next/navigation";
import paths from "@/lib/fetches/paths";
import generalFetch from "@/lib/fetches/generalFetch";

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
      await generalFetch({
        clientType: "server",
        path: paths.api.v1.admin.servers.all(true),
      }),
  });
  // useEffect(() => {
  //   if (!data?.user && !isLoading) {
  //     router.replace("/");
  //   }
  // }, [data, isLoading, router]);

  //if (isLoading) return <div>Loading...</div>;
  // if (!data?.user) {
  //   return <></>;
  // }

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <AdminLayout>{children}</AdminLayout>
      </HydrationBoundary>
    </>
  );
}
