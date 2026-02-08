"use client";

import { usePathname } from "@/i18n/navigation";
import VMTitle from "../title/title";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { useSession } from "@/hooks/useSession";
import qk from "@/lib/fetches/keys";
import { notFound } from "next/navigation";
import VMUserPermissions, {
  parsePermissionVMUser,
} from "@/types/VMUserPermissions";

interface props {
  publicId: number;
  translations: {
    navbar: {
      dashboard: string;
      console: string;
      reset: string;
      subusers: string;
      settings: string;
    };
  };
}

interface NavBarLink {
  name: string;
  href: (id: number) => string;
  subNavBar?: Array<NavBarLink>;
}

type NavBarLinks = Array<NavBarLink>;

const navbarLinks: NavBarLinks = [
  {
    name: "Dashboard",
    href: (id: number) => `/admin/vm/${id}`,
  },
  {
    name: "Console",
    href: (id: number) => `/admin/vm/${id}/console`,
    subNavBar: [
      { name: "SSHTerm", href: (id: number) => `/admin/vm/${id}/console` },
      { name: "VNC (WIP)", href: (id: number) => `#` }, // VNC not implemented yet
    ],
  },
  {
    name: "Reset",
    href: (id: number) => `/admin/vm/${id}/format`,
    subNavBar: [
      { name: "Cloud Image", href: (id: number) => `/admin/vm/${id}/format` },
      { name: "ISOs (WIP)", href: (id: number) => `#` }, // Full reset not implemented yet
    ],
  },
  {
    name: "SubUsers",
    href: (id: number) => `/admin/vm/${id}/subusers`,
  },
  {
    name: "Settings",
    href: (id: number) => `/admin/vm/${id}/settings`,
  },
];

export default function VMNavbarAdmin(props: props) {
  const path = usePathname();
  const session2 = useSession();

  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.admin.vms.getById(props.publicId),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/vms/${props.publicId}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
  });

  console.log(data);

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <VMTitle name={data!.name} publicId={data!.publicId} />
        <div className="flex flex-row text-sm">
          {navbarLinks.map((link) => {
            return (
              <a
                key={link.name}
                href={link.href(props.publicId)}
                className={`${path === link.href(props.publicId) && "underline"} mr-4`}
              >
                {
                  props.translations.navbar[
                    link.name.toLowerCase().replace("-", "") as
                      | "dashboard"
                      | "console"
                      | "reset"
                      | "subusers"
                      | "settings"
                  ]
                }
              </a>
            );
          })}
        </div>
        <div className="flex flex-row text-sm">
          {navbarLinks
            .find(
              (link) => path === link.href(props.publicId) && link.subNavBar,
            )
            ?.subNavBar?.map((sublink) => (
              <a
                key={sublink.name}
                href={sublink.href(props.publicId)}
                className={`${
                  path === sublink.href(props.publicId) && "underline"
                } mr-4`}
              >
                {sublink.name}
              </a>
            ))}
        </div>
      </div>
    </>
  );
}
