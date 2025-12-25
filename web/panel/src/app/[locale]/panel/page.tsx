import LineChart from "@/components/Chart/ChartExample";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("login");

  return (
    <>
      <LineChart />
    </>
  );
}
