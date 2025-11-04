import { getTranslations } from "next-intl/server";
import Link from "next/dist/client/link";

export default async function Page() {
  const t = await getTranslations("hello");

  return (
    <>
      <div>{t("hey")}</div>
      <Link locale={"pt"} href={"/"}>
        Change to PT
      </Link>
      <Link locale={"en"} href={"/"}>
        Change to EN
      </Link>
    </>
  );
}
