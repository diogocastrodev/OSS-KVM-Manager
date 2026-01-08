"use client";
import Logo from "@/components/Icon/Logo";
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

  return (
    <>
      <div className="flex-1 flex flex-col p-2 pb-0">
        <div className="flex-1 flex flex-row">
          <div className="w-60 h-full flex flex-col gap-y-2 p-1 pr-3 pb-3">
            <div className="flex flex-row items-center justify-center gap-x-1.5 mb-4">
              <Logo props={{ className: "size-14" }} />
              <span className="font-semibold text-2xl">Serverseer</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <div className="text-xl font-semibold">Panel</div>
              <div className="text-xl font-semibold">Admin</div>
              <div className="my-4"></div>
              <div className="text-sm font-semibold">Datacenters</div>
              <div className="flex flex-col gap-y-2">
                <div>Home</div>
                <div className="pl-4 flex flex-col gap-y-2">
                  <div className="flex flex-col gap-y-1">
                    <div>Server 1</div>
                    <div className="pl-4 flex flex-col gap-y-1">
                      <div>Virtual Machine 1</div>
                      <div>Virtual Machine 2</div>
                      <div>Virtual Machine 3</div>
                      <div>Virtual Machine 4</div>
                      <div>Virtual Machine 5</div>
                      <div>Virtual Machine 6</div>
                    </div>
                  </div>
                  <div className="">Server 2</div>
                  <div className="">Server 3</div>
                  <div className="">Server 4</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-auto gap-y-2">
              <div className="flex flex-row px-1 items-center gap-x-2">
                {/* Change Themes */}
                <div className="flex items-center justify-center p-2 bg-(--color-background-secondary) rounded-full">
                  {theme === "light" ? (
                    <MoonIcon onClick={() => setTheme("dark")}></MoonIcon>
                  ) : (
                    <SunIcon onClick={() => setTheme("light")}></SunIcon>
                  )}
                </div>
                {/* Change Locales */}
                <div className="ml-auto flex items-center justify-center flex-row bg-(--color-background-secondary) rounded-md gap-x-2">
                  {routing.locales.map((lo) => (
                    <div
                      key={lo}
                      className={`${
                        lo === l
                          ? "bg-(--color-background-selected) px-2 py-1 rounded-md cursor-default"
                          : "bg-transparent cursor-pointer"
                      } px-1`}
                      onClick={(e) => {
                        locale.replace(pathname, {
                          locale: lo,
                        });
                      }}
                    >
                      {lo}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full h-12 bg-(--color-background-secondary) flex flex-row rounded-lg">
                <div className="p-2 flex items-center justify-center">
                  <div className="w-8 h-8 dark:bg-zinc-600 bg-zinc-700 rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center pl-1">
                  <span className="text-base text-zinc-300 ">Diogo</span>
                  <span className="text-xs text-zinc-500">Email</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-(--color-background-secondary) rounded-t-lg overflow-y-auto p-1"></div>
        </div>
      </div>
    </>
  );
}
