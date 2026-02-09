import { getTranslations } from "next-intl/server";
import PanelPage from "./PanelPage";

export default async function Page() {
  const t = await getTranslations("panel.main");
  return (
    <>
      <PanelPage
        translations={{
          welcome: t("welcome"),
          yourVMs: t("your-vms"),
          os: {
            unknown: t("os.unknown"),
          },
          status: {
            operational: t("status.operational"),
            notOperational: t("status.not-operational"),
          },
        }}
      />
    </>
  );
}
