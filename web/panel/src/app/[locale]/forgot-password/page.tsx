import { getTranslations } from "next-intl/server";
import ForgotPassword from "./ForgotPassword";

export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getTranslations("forgot-password");

  return (
    <>
      <ForgotPassword
        translation={{
          email: t("email"),
          buttonText: t("buttonText"),
        }}
      />
    </>
  );
}
