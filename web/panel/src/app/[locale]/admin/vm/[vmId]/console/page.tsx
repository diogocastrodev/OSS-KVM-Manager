import { getTranslations } from "next-intl/server";
import ConsoleClient from "./ConsoleClient";

type Params = { locale: string; vmId: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { vmId } = await params;
  const t = await getTranslations("panel-vm.console-page");
  return (
    <ConsoleClient
      params={{
        vmId,
      }}
      props={{
        translations: {
          openConsole: t("open-console"),
          tip: {
            text: t("tip.text"),
            command: t("tip.command"),
          },
        },
      }}
    />
  );
}
