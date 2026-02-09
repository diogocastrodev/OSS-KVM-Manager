import { getTranslations } from "next-intl/server";
import ServerSettings from "./ServerSettings";

export default async function ServersSettingsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const t = await getTranslations("admin.server-page.settings");

  return (
    <>
      <ServerSettings
        serverId={parseInt(serverId)}
        translations={{
          title: t("title"),
          toast: {
            trySuccess: t("toast.try-success"),
            tryError: t("toast.try-error"),
            updateSuccess: t("toast.update-success"),
            updateError: t("toast.update-error"),
            deleteSuccess: t("toast.delete-success"),
            deleteError: t("toast.delete-error"),
          },
          endpoint: {
            agentEndpoint: t("endpoint.agent-endpoint"),
            invalidAgentEndpoint: t("endpoint.invalid-agent-endpoint"),
            placeholderAgentEndpoint: t("endpoint.placeholder-agent-endpoint"),
            tryFinding: t("endpoint.try-finding"),
          },
          dataFound: {
            title: t("data-found.title"),
            cpus: t("data-found.cpus"),
            vcpus: t("data-found.vcpus"),
            memory: t("data-found.memory"),
            disk: t("data-found.disk"),
            failed: t("data-found.failed"),
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
            cpus: t("resources.cpus"),
            invalidCpus: t("resources.invalid-cpus"),
            placeholderCpus: t("resources.placeholder-cpus"),
            vcpus: t("resources.vcpus"),
            invalidVcpus: t("resources.invalid-vcpus"),
            placeholderVcpus: t("resources.placeholder-vcpus"),
            memory: t("resources.memory"),
            invalidMemory: t("resources.invalid-memory"),
            placeholderMemory: t("resources.placeholder-memory"),
            disk: t("resources.disk"),
            invalidDisk: t("resources.invalid-disk"),
            placeholderDisk: t("resources.placeholder-disk"),
            inLink: t("resources.in-link"),
            invalidInLink: t("resources.invalid-in-link"),
            placeholderInLink: t("resources.placeholder-in-link"),
            outLink: t("resources.out-link"),
            invalidOutLink: t("resources.invalid-out-link"),
            placeholderOutLink: t("resources.placeholder-out-link"),
          },
          maxResources: {
            title: t("max-resources.title"),
            vcpus: t("max-resources.vcpus"),
            invalidVcpus: t("max-resources.invalid-vcpus"),
            placeholderVcpus: t("max-resources.placeholder-vcpus"),
            memory: t("max-resources.memory"),
            invalidMemory: t("max-resources.invalid-memory"),
            placeholderMemory: t("max-resources.placeholder-memory"),
            disk: t("max-resources.disk"),
            invalidDisk: t("max-resources.invalid-disk"),
            placeholderDisk: t("max-resources.placeholder-disk"),
          },
          network: {
            title: t("network.title"),
            vmNetwork: t("network.vm-network"),
            invalidVmNetwork: t("network.invalid-vm-network"),
            placeholderVmNetwork: t("network.placeholder-vm-network"),
            vmNetworkMask: t("network.vm-network-mask"),
            invalidVmNetworkMask: t("network.invalid-vm-network-mask"),
            placeholderVmNetworkMask: t("network.placeholder-vm-network-mask"),
            vmNetworkGateway: t("network.vm-network-gateway"),
            invalidVmNetworkGateway: t("network.invalid-vm-network-gateway"),
            placeholderVmNetworkGateway: t(
              "network.placeholder-vm-network-gateway",
            ),
          },
          buttonUpdate: t("button-update"),
          delete: {
            confirmation: t("delete.confirmation"),
            button: t("delete.button"),
          },
        }}
      />
    </>
  );
}
