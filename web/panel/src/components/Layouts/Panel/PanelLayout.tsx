"use client";

import { useSession } from "@/hooks/useSession";
import { useRouter as useLocaleRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Logo from "@/components/Icon/Logo";
import {
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { fetchMyVMs } from "@/lib/fetches/fetchMyVMs";
import { useEffect, useRef, useState } from "react";
import qk from "@/lib/fetches/keys";
import { apiFetch } from "@/lib/apiFetch";

const dropdownMenuItems: Array<{
  icon?: React.ReactNode;
  label: string;
  href?: string;
  action?: () => void;
  spacer?: boolean;
}> = [
  { icon: <UserIcon />, label: "Profile" },
  {
    icon: <SettingsIcon />,
    label: "Settings",
    spacer: true,
  },
  {
    icon: <LogOutIcon />,
    label: "Logout",
    action: async () => {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    },
  },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const locale = useLocaleRouter();
  const l = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const session2 = useSession();

  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.server.myServers(),
    queryFn: fetchMyVMs,
    staleTime: 60_000,
  });

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (
        isUserDropdownOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isUserDropdownOpen]);

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
            <div className="flex flex-col flex-1 gap-y-2">
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
              <div className="flex flex-col flex-1 gap-y-2 bg-(--color-background-selected) p-2 rounded-lg shadow-md overflow-y-auto overflow-x-hidden">
                <div>Home</div>
                <div className="pl-4 flex flex-col gap-y-2">
                  {data &&
                    data.servers &&
                    data.servers.map((s) => {
                      return (
                        <div
                          className="flex flex-col gap-y-1"
                          key={`s-${s.publicId}`}
                        >
                          <span>{s.name}</span>
                          <div className="pl-4 flex flex-col gap-y-1">
                            {s.virtual_machines &&
                              s.virtual_machines.map((vm) => {
                                return (
                                  <a
                                    key={`${s.publicId}-${vm.publicId}`}
                                    href={`/${pathname.includes("admin") ? "admin" : "panel"}/vm/${vm.publicId}`}
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
            <div className="flex flex-col gap-y-2">
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
              <div
                className="w-full h-12 bg-(--color-background-secondary) flex flex-row rounded-lg shadow-md relative"
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                }}
                ref={menuRef}
              >
                <div className="p-2 flex items-center justify-center">
                  <div className="w-8 h-8 bg-(--color-background-primary) rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center pl-1">
                  <span className="text-base text-(--color-foreground) ">
                    {session2.data?.name}
                  </span>
                  <span className="text-xs text-(--color-foreground-secondary)">
                    {session2.data?.email}
                  </span>
                </div>
                {isUserDropdownOpen && (
                  <div className="absolute bottom-14 left-0 w-full bg-(--color-background-secondary) rounded-lg shadow-md flex flex-col gap-y-0.5 z-10 before:absolute before:top-full before:left-4 before:border-8 before:border-x-transparent before:border-b-transparent before:border-(--color-background-secondary) before:border-t-8">
                    {dropdownMenuItems.map((item, idx) => {
                      return (
                        <>
                          <a
                            className="px-2 py-1 hover:bg-(--color-background-selected) cursor-pointer flex flex-row rounded-lg items-center"
                            href={item.href || "#"}
                            key={`dropdown-item-${idx}`}
                            onClick={item.action ? item.action : undefined}
                          >
                            {item.icon && (
                              <div className="mr-2 w-5 flex items-center justify-center">
                                {item.icon}
                              </div>
                            )}
                            {item.label}
                          </a>
                          {item.spacer && (
                            <div
                              className="mx-1 border-b-2 border-(--color-background-primary)"
                              key={`dropdown-spacer-${idx}`}
                            ></div>
                          )}
                        </>
                      );
                    })}
                  </div>
                )}
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
