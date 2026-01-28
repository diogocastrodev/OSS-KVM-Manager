"use client";
import Logo from "@/components/Icon/Logo";
import { useSession } from "@/hooks/useSession";
import { useRouter as useLocaleRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { MoonIcon, SunIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { useTheme } from "next-themes";

export default function Page() {
  const locale = useLocaleRouter();
  const l = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // const t = await getTranslations("panel");
  const s = useSession();

  return (
    <>
      <div className="flex flex-col p-2">
        <div className="text-2xl">Welcome to the Panel {s.data?.name}!</div>
      </div>
    </>
  );
}
