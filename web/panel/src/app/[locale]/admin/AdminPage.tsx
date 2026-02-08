"use client";

import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";

type HealthStatus = "HEALTHY" | "UNHEALTHY" | "UNKNOWN";
type ServerStatus = "ACTIVE" | "MAINTENANCE" | "DISABLED";

export interface AdminServerHealthResponse {
  servers: {
    publicId: number;
    name: string;
    status: ServerStatus;
    health: HealthStatus;
    vmsCount: number;
  }[];
}

export default function AdminPage() {
  const { data } = useQuery({
    queryKey: [qk.api.v1.admin.servers.allHealth()],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/admin/servers/health");
      if (!res.ok) {
        throw new Error("Failed to fetch server health");
      }
      return res.json() as Promise<AdminServerHealthResponse>;
    },
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="text-2xl">Server Status:</div>
        <div className="flex flex-wrap gap-3">
          {data &&
            data.servers.map((server) => (
              <div
                key={server.publicId}
                className="bg-(--color-background-primary) w-80 h-32 rounded-md"
              >
                <div className="h-full flex flex-col p-3">
                  <div className="flex flex-row gap-x-2">
                    <a
                      className="text-lg font-bold"
                      href={`/admin/server/${server.publicId}`}
                    >
                      {server.name}
                    </a>
                    <span className="text-xs flex items-end">
                      {server.publicId}
                    </span>
                  </div>
                  <div className="text-sm pt-1">
                    Virtual Machines: {server.vmsCount}
                  </div>
                  <div className="mt-auto text-sm text-(--color-foreground-secondary) flex flex-row items-center gap-x-1">
                    <div className="flex flex-col">
                      <div className="flex flex-row gap-x-1 items-center">
                        {server.status === "ACTIVE" ? (
                          <div className="bg-green-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        ) : (
                          <div className="bg-red-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        )}
                        <span>
                          {server.status === "ACTIVE"
                            ? "Active"
                            : server.status === "MAINTENANCE"
                              ? "Maintenance Mode"
                              : "Disabled"}
                        </span>
                      </div>
                      <div className="flex flex-row gap-x-1 items-center">
                        {server.health === "HEALTHY" ? (
                          <div className="bg-green-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        ) : (
                          <div className="bg-red-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
                        )}
                        <span>
                          {server.health === "HEALTHY"
                            ? "Operational"
                            : server.health === "UNHEALTHY"
                              ? "Not Operational"
                              : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
