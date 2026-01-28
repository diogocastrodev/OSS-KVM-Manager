"use client";

import { useSession } from "@/hooks/useSession";
import { useRouter as useLocaleRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Logo from "@/components/Icon/Logo";
import { MoonIcon, SunIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { fetchAllVMs, fetchMyVMs } from "@/lib/fetches/fetchMyVMs";
import { useEffect } from "react";
import qk from "@/lib/fetches/keys";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocaleRouter();
  const l = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const session2 = useSession();

  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.admin.servers.all(),
    queryFn: fetchAllVMs,
    staleTime: 60_000,
  });

  const qc = new QueryClient();

  console.log(session2.data);

  // useEffect(() => {
  //   if (!data?.user && !isLoading) {
  //     router.replace("/");
  //   }
  // }, [data, isLoading, router]);

  //if (isLoading) return <div>Loading...</div>;
  // if (!data?.user) {
  //   return <></>;
  // }

  return (
    <>
      {/* <PanelSidebar /> */}
      {/* <PanelContent>{children}</PanelContent> */}
      <div className="flex-1 flex flex-col p-2 pb-0">
        <div className="flex-1 flex flex-row">
          <div className="w-60 h-full flex flex-col gap-y-2 p-1 pr-3 pb-3">
            <div className="flex flex-row items-center justify-center gap-x-1.5 mb-4">
              <Logo props={{ className: "size-14" }} />
              <span className="font-semibold text-2xl">Serverseer</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <div className="text-xl font-semibold">
                <a href="/panel">Panel</a>
              </div>
              {session2.data?.role === "ADMIN" && (
                <div className="text-xl font-semibold">
                  <a href="/admin">Admin</a>
                </div>
              )}

              <div className="my-4"></div>
              <div className="text-sm font-semibold">Datacenters</div>
              <div className="flex flex-col gap-y-2">
                <div className="flex">
                  <div>Home</div>
                  <div className="ml-auto border rounded-4xl w-6 justify-center flex">
                    <a href={`/admin/server/create/`}>+</a>
                  </div>
                </div>
                <div className="pl-4 flex flex-col gap-y-2">
                  {data &&
                    data.servers &&
                    data.servers.map((s) => {
                      return (
                        <div
                          className="flex flex-col gap-y-1"
                          key={`s-${s.publicId}`}
                        >
                          <a href={`/admin/server/${s.publicId}/`}>{s.name}</a>
                          <div className="pl-4 flex flex-col gap-y-1">
                            {s.virtual_machines &&
                              s.virtual_machines.map((vm) => {
                                return (
                                  <a
                                    key={`${s.publicId}-${vm.publicId}`}
                                    href={`/admin/vm/${vm.publicId}`}
                                  >
                                    {vm.name}
                                  </a>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-auto gap-y-2">
              <div className="flex flex-row px-1 items-center gap-x-2">
                {/* Change Themes */}
                <div className="flex items-center justify-center p-2 bg-(--color-background-secondary) rounded-full shadow-md cursor-pointer">
                  {theme === "light" ? (
                    <MoonIcon onClick={() => setTheme("dark")}></MoonIcon>
                  ) : (
                    <SunIcon onClick={() => setTheme("light")}></SunIcon>
                  )}
                </div>
                {/* Change Locales */}
                <div className="ml-auto flex items-center justify-center flex-row bg-(--color-background-secondary) rounded-md gap-x-2 shadow-md">
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
              <div className="w-full h-12 bg-(--color-background-secondary) flex flex-row rounded-lg shadow-md">
                <div className="p-2 flex items-center justify-center">
                  <div className="w-8 h-8 dark:bg-zinc-600 bg-zinc-700 rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center pl-1">
                  <span className="text-base text-zinc-300 ">
                    {session2.data?.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {session2.data?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-(--color-background-secondary) rounded-t-lg overflow-y-auto p-1">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
