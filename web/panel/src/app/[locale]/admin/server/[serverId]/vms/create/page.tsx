import { getTranslations } from "next-intl/server";
import CreateVM from "./CreateVM";

type Params = { locale: string; serverId: string };

export default async function VMCreatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { serverId } = await params;
  const t = await getTranslations("admin.server-page.create-vm");
  return (
    <>
      <CreateVM
        serverId={serverId}
        translations={{
          title: t("title"),
          toast: {
            success: t("toast.success"),
            error: t("toast.error"),
          },
          server: {
            title: t("server.title"),
            vcpuAvailable: t("server.vcpu-available"),
            memoryAvailable: t("server.memory-available"),
            diskAvailable: t("server.disk-available"),
            networkInLink: t("server.network-in-link"),
            networkOutLink: t("server.network-out-link"),
            machineNetworkVms: t("server.machine-network-vms"),
            machineNetworkGateway: t("server.machine-network-gateway"),
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
            localIp: t("network.local-ip"),
            invalidLocalIp: t("network.invalid-local-ip"),
            placeholderLocalIp: t("network.placeholder-local-ip"),
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
          button: t("button"),
        }}
      />
    </>
  );
}
