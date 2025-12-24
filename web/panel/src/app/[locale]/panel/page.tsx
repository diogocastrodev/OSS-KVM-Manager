import LineChart from "@/components/Chart/ChartExample";
import { getTranslations } from "next-intl/server";
import Link from "next/dist/client/link";

export default async function Page() {
  const t = await getTranslations("login");

  return (
    <>
      <LineChart />
    </>
  );
}
