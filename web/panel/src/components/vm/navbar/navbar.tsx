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
}

interface NavBarLink {
  name: string;
  href: (id: number) => string;
  permission?: VMUserPermissions;
  subNavBar?: Array<NavBarLink>;
}

type NavBarLinks = Array<NavBarLink>;

const navbarLinks: NavBarLinks = [
  {
    name: "Dashboard",
    href: (id: number) => `/panel/vm/${id}`,
  },
  {
    name: "Console",
    href: (id: number) => `/panel/vm/${id}/console`,
    subNavBar: [
      { name: "SSHTerm", href: (id: number) => `/panel/vm/${id}/console` },
      { name: "VNC (WIP)", href: (id: number) => `#` }, // VNC not implemented yet
    ],
    permission: VMUserPermissions.operator,
  },
  {
    name: "Reset",
    href: (id: number) => `/panel/vm/${id}/format`,
    subNavBar: [
      { name: "Cloud Image", href: (id: number) => `/panel/vm/${id}/format` },
      { name: "ISOs (WIP)", href: (id: number) => `#` }, // Full reset not implemented yet
    ],
    permission: VMUserPermissions.operator,
  },
  {
    name: "Sub-Users",
    href: (id: number) => `/panel/vm/${id}/sub-users`,
    permission: VMUserPermissions.owner,
  },
];

export default function VMNavbar(props: props) {
  const path = usePathname();
  const session2 = useSession();

  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.vms.getVMById(props.publicId),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/vms/${props.publicId}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
  });

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <VMTitle name={data!.name} publicId={data!.publicId} />
        <div className="flex flex-row  text-sm">
          {navbarLinks.map((link) => {
            if (
              link.permission &&
              parsePermissionVMUser(data!.role.toLowerCase()) < link.permission
            ) {
              return null;
            } else {
              return (
                <a
                  key={link.name}
                  href={link.href(props.publicId)}
                  className={`${path === link.href(props.publicId) && "underline"} mr-4`}
                >
                  {link.name}
                </a>
              );
            }
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
