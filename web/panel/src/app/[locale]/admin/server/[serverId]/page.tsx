import { getTranslations } from "next-intl/server";
import ServerPageClient from "./ServerPage";

type Params = { locale: string; serverId: string };

export default async function ServerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { serverId } = await params;
  const t = await getTranslations("admin.server-page.dashboard");
  return (
    <>
      <ServerPageClient
        serverId={serverId}
        translations={{
          title: t("title"),
          statusMsg: t("status-msg"),
          agentMsg: t("agent-msg"),
          healthCheck: {
            msg: t("health-check.msg"),
            button: t("health-check.button"),
            success: t("health-check.success"),
            error: t("health-check.error"),
          },
          resources: {
            title: t("resources.title"),
            vcpusTitle: t("resources.vcpus-title"),
            vcpusLabel: t("resources.vcpus-label"),
            memoryTitle: t("resources.memory-title"),
            memoryLabel: t("resources.memory-label"),
            diskTitle: t("resources.disk-title"),
            diskLabel: t("resources.disk-label"),
          },
          status: {
            active: t("status.active"),
            maintenance: t("status.maintenance"),
            disabled: t("status.disabled"),
          },
        }}
      />
    </>
  );
}
