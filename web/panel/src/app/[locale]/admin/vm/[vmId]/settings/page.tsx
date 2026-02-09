import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import VMsSettings from "./VmsSettings";
import { apiFetchServer } from "@/lib/apiFetchServer";
import qk from "@/lib/fetches/keys";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function ServersSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; vmId: string }>;
}) {
  const { vmId } = await params;
  const qc = new QueryClient();
  const t = await getTranslations("admin.vms-page.settings");

  await qc.fetchQuery({
    queryKey: [qk.api.v1.admin.vms.getById(parseInt(vmId))],
    queryFn: async () => {
      const d = await apiFetchServer(
        `/api/v1/admin/vms/${vmId}?include_server=true`,
      );
      if (!d.ok) {
        notFound();
      }
      return d.json() as Promise<AdminGetVMByIDResponse>;
    },
  });
  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <VMsSettings
          vmId={vmId}
          translations={{
            title: t("title"),
            server: {
              title: t("server.title"),
              vcpuAvailable: t("server.vcpu-available"),
              memoryAvailable: t("server.memory-available"),
              diskAvailable: t("server.disk-available"),
              networkInLink: t("server.network-in-link"),
              networkOutLink: t("server.network-out-link"),
            },
            general: {
              title: t("general.title"),
              name: t("general.name"),
              invalidName: t("general.invalid-name"),
              placeholderName: t("general.placeholder-name"),
              publicId: t("general.public-id"),
              invalidPublicId: t("general.invalid-public-id"),
              placeholderPublicId: t("general.placeholder-public-id"),
            },
            resources: {
              title: t("resources.title"),
              vcpus: t("resources.vcpus"),
              invalidVcpus: t("resources.invalid-vcpus"),
              placeholderVcpus: t("resources.placeholder-vcpus"),
              memory: t("resources.memory"),
              invalidMemory: t("resources.invalid-memory"),
              placeholderMemory: t("resources.placeholder-memory"),
              disk: t("resources.disk"),
              invalidDisk: t("resources.invalid-disk"),
              placeholderDisk: t("resources.placeholder-disk"),
            },
            network: {
              title: t("network.title"),
              netInAvg: t("network.net-in-avg"),
              invalidNetInAvg: t("network.invalid-net-in-avg"),
              placeholderNetInAvg: t("network.placeholder-net-in-avg"),
              netOutAvg: t("network.net-out-avg"),
              invalidNetOutAvg: t("network.invalid-net-out-avg"),
              placeholderNetOutAvg: t("network.placeholder-net-out-avg"),
              netInPeak: t("network.net-in-peak"),
              invalidNetInPeak: t("network.invalid-net-in-peak"),
              placeholderNetInPeak: t("network.placeholder-net-in-peak"),
              netOutPeak: t("network.net-out-peak"),
              invalidNetOutPeak: t("network.invalid-net-out-peak"),
              placeholderNetOutPeak: t("network.placeholder-net-out-peak"),
              netInBurst: t("network.net-in-burst"),
              invalidNetInBurst: t("network.invalid-net-in-burst"),
              placeholderNetInBurst: t("network.placeholder-net-in-burst"),
              netOutBurst: t("network.net-out-burst"),
              invalidNetOutBurst: t("network.invalid-net-out-burst"),
              placeholderNetOutBurst: t("network.placeholder-net-out-burst"),
            },
            buttonUpdate: t("button-update"),
            delete: {
              button: t("delete.button"),
              confirmation: t("delete.confirmation"),
            },
            toast: {
              success: t("toast.success"),
              error: t("toast.error"),
              successDelete: t("toast.success-delete"),
              errorDelete: t("toast.error-delete"),
            },
          }}
        />
      </HydrationBoundary>
    </>
  );
}
