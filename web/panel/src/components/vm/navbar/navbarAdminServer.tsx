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
  //   translations: {
  //     navbar: {
  //       dashboard: string;
  //       console: string;
  //       reset: string;
  //       subusers: string;
  //     };
  //   };
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
    href: (id: number) => `/admin/server/${id}`,
  },
  {
    name: "Virtual machines",
    href: (id: number) => `/admin/server/${id}/vms`,
    subNavBar: [
      {
        name: "List VMs",
        href: (id: number) => `/admin/server/${id}/vms`,
      },
      {
        name: "Create VM",
        href: (id: number) => `/admin/server/${id}/vms/create`,
      },
    ],
  },
  {
    name: "Settings",
    href: (id: number) => `/admin/server/${id}/settings`,
  },
];

export interface ServerData {
  publicId: number;
  name: string;
  cpus: number;
  vcpus: number;
  ram: number;
  disk: number;
  in_link: number;
  out_link: number;
  ipLocal: string;
  ipPublic?: string;
  vcpus_max: number;
  ram_max: number;
  disk_max: number;
  vcpus_available: number;
  ram_available: number;
  disk_available: number;
  agent_port: number;
  vms_gateway?: string;
  vms_network?: string;
  vms_network_mask?: string;
  status: string;
  vms_mac_prefix?: string;
  public_key?: string;
}

export default function VMNavbarAdminServer(props: props) {
  const path = usePathname();
  const session2 = useSession();

  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.admin.servers.getById(props.publicId)],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/servers/${props.publicId}`);
      return d.json() as Promise<ServerData>;
    },
    staleTime: 60_000,
  });

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
                // Q: If I use startsWith the /admin/server/1 will match it always
                // A: Yes, but that's what we want, because we want the dashboard to be underlined when we are in the dashboard or in any of the subpages, like /admin/server/1/vms or /admin/server/1/vms/create
                // Q: When I'm in /admin/server/1/vms/create only the virtual machines will be underlined, but I want only the virtual machines to be underlined
                // Q: No right now it matches the Dashboar dand the "Virtual machines" because both are startsWith, but I want only the "Virtual machines" to be underlined
                // A: Oh I see, you want only the "Virtual machines" to be underlined when we are in /admin/server/1/vms or /admin/server/1/vms/create, and not the "Dashboard", because the "Dashboard" is only for /admin/server/1
                // Q: Yes
                // A: Ok, we can check if the path is exactly equal to the href of the link, and if it's not, we can check if the path starts with the href of the link, but only if the link has a subNavBar, because if it doesn't have a subNavBar, then we want it to be underlined only when the path is exactly equal to the href of the link

                className={`${path === link.href(props.publicId) || (link.subNavBar && path.startsWith(link.href(props.publicId))) ? "underline" : ""} mr-4`}
              >
                {/* {
                  props.translations.navbar[
                    link.name.toLowerCase().replace("-", "") as
                      | "dashboard"
                      | "console"
                      | "reset"
                      | "subusers"
                  ]
                } */}
                {link.name}
              </a>
            );
          })}
        </div>
        <div className="flex flex-row text-sm">
          {navbarLinks.length > 0 &&
            navbarLinks
              .find(
                (link) =>
                  path.startsWith(link.href(props.publicId)) && link.subNavBar,
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
