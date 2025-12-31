import { getTranslations } from "next-intl/server";
import LoginForm from "./LoginForm";
import GuestGate from "@/components/Gate/GuestGate";

export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getTranslations("login");

  return (
    <>
      <LoginForm
        translation={{
          username: t("username"),
          password: t("password"),
          forgotPassword: t("forgotPassword"),
          login: t("login"),
        }}
      />
    </>
  );
}
