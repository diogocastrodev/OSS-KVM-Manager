import { getTranslations } from "next-intl/server";
import VMDashboard from "./vmDashboard";

type Params = { locale: string; vmId: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
  const { vmId } = await params;
  const t = await getTranslations("panel-vm");
  return (
    <>
      <VMDashboard
        vmID={vmId}
        translations={{
          states: {
            pretext: t("status.pre-message"),
            shutoff: t("status.shutoff"),
            running: t("status.running"),
            stopped: t("status.stopped"),
            paused: t("status.paused"),
            unknown: t("status.unknown"),
          },
          buttons: {
            start: t("buttons-action.start"),
            shutdown: t("buttons-action.shutdown"),
            restart: t("buttons-action.restart"),
            kill: t("buttons-action.kill"),
          },
          banner: {
            title: t("banner-info.title"),
            vcpus: t("banner-info.vcpus"),
            memory: t("banner-info.memory"),
            disk: t("banner-info.disk"),
            inout: t("banner-info.inout"),
            ips: {
              title: t("banner-info.ips.title"),
              local: t("banner-info.ips.local"),
              public: t("banner-info.ips.public"),
            },
          },
          graphs: {
            title: t("graphs.title"),
            cpuTitle: t("graphs.cpu-usage"),
            memoryTitle: t("graphs.memory-usage"),
          },
        }}
      />
    </>
  );
}
