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
          email: t("email"),
          invalidEmail: t("invalid-email"),
          placeholderEmail: t("placeholder-email"),
          password: t("password"),
          invalidPassword: t("invalid-password"),
          placeholderPassword: t("placeholder-password"),
          forgotPassword: t("forgotPassword"),
          login: t("login"),
        }}
      />
    </>
  );
}
