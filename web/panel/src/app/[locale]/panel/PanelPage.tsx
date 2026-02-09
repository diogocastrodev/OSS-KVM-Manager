"use client";

import DebianIcon from "@/components/Icon/DebianIcon";
import UbuntuIcon from "@/components/Icon/UbuntuIcon";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/apiFetch";
import { myVMsResponse } from "@/lib/fetches/fetchMyVMs";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";

interface props {
  translations: {
    welcome: string;
    yourVMs: string;
    os: {
      unknown: string;
    };
    status: {
      operational: string;
      notOperational: string;
    };
  };
}

export default function PanelPage({ translations: t }: props) {
  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.server.myServers(),
    queryFn: async () => {
      const d = await apiFetch("/api/v1/servers?include_virtual_machines=true");
      return d.json() as Promise<myVMsResponse>;
    },
    staleTime: 60_000,
  });
  const s = useSession();

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="text-2xl">
          {t.welcome} {s.data?.name}!
        </div>
        <div className="flex flex-col gap-y-2">
          <div className="text-xl">{t.yourVMs}</div>
          <div className="flex flex-wrap gap-3">
            {data &&
              data.servers.map((server) =>
                server.virtual_machines?.map((vm) => (
                  <div
                    key={vm.publicId}
                    className="bg-(--color-background-primary) w-80 h-32 rounded-md"
                  >
                    <div className="h-full flex flex-col p-3 gap-y-2">
                      <a
                        className="text-lg font-bold"
                        href={`/panel/vm/${vm.publicId}`}
                      >
                        {vm.name}
                      </a>
                      <div className="flex flex-row items-center gap-x-1">
                        {vm.os.toLowerCase().includes("ubuntu") ? (
                          <UbuntuIcon />
                        ) : vm.os.toLowerCase().includes("debian") ? (
                          <DebianIcon />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-500 animate-pulse duration-200"></div>
                        )}
                        <span>
                          {vm.os ? vm.os : t.os.unknown}{" "}
                          {vm.osVersion ? vm.osVersion : ""}
                        </span>
                      </div>
                      <div className="mt-auto text-sm text-(--color-foreground-secondary) flex flex-row items-center gap-x-1">
                        {vm.status === "OPERATIONAL" ||
                        vm.status === "RUNNING" ? (
                          <div className="bg-green-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        ) : (
                          <div className="bg-red-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        )}
                        <span>
                          {vm.status === "OPERATIONAL" ||
                          vm.status === "RUNNING"
                            ? t.status.operational
                            : t.status.notOperational}
                        </span>
                        {vm.status !== "OPERATIONAL" && (
                          <>
                            <div className="bg-yellow-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                            <span>{vm.status}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )),
              )}
          </div>
        </div>
      </div>
    </>
  );
}
