"use client";
import SemiGauge from "@/components/Gauge/GaugeExample";
import { ServerData } from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";

interface props {
  serverId: string;
}

export default function ServerPageClient(props: props) {
  const { serverId } = props;

  const { data: healthCheck, refetch: healthCheckRefetch } = useQuery({
    queryKey: [qk.api.v1.admin.servers.healthcheck(parseInt(serverId))],
    queryFn: async () => {
      const d = await apiFetch(
        `/api/v1/admin/servers/${serverId}/health-check`,
        {
          method: "POST",
        },
      );
      return d.json() as Promise<{ alive: boolean }>;
    },
  });

  const { data } = useQuery({
    queryKey: [qk.api.v1.admin.servers.getById(parseInt(serverId))],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/servers/${serverId}`);
      return d.json() as Promise<ServerData>;
    },
    staleTime: 60_000,
  });

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="">
          The server is set to
          <span className="capitalize pl-1">{data?.status.toLowerCase()}</span>
        </div>
        <div>
          The agent in the server can be found at
          <span className="font-mono pl-1">
            {data?.ipLocal}:{data?.agent_port}
          </span>
        </div>
        <div className="flex flex-row">
          Check if server is alive:
          <button
            className="pl-1 italic underline"
            onClick={() => healthCheckRefetch()}
          >
            Click Here
          </button>
          <div className="pl-4">
            {healthCheck && (
              <span className="flex flex-row items-center pl-4">
                {healthCheck !== undefined ? (
                  healthCheck.alive ? (
                    <>
                      <div className="text-(--color-text-success) flex flex-row items-center gap-x-1">
                        <div className="w-3 h-3 bg-(--color-traffic-green) rounded-full animate-pulse duration-1000"></div>
                        Alive
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-(--color-text-error) flex flex-row items-center gap-x-1">
                        <div className="w-3 h-3 bg-(--color-traffic-red) rounded-full animate-pulse duration-1000"></div>
                        Not Alive
                      </div>
                    </>
                  )
                ) : (
                  ""
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      {data && (
        <div className="w-full flex flex-row gap-x-4 bg-(--color-background-primary) p-4 rounded">
          <div className="flex-1 basis-0 min-w-0">
            <SemiGauge
              title="vCPU Available"
              label="vCPU available"
              value={data.vcpus_available || 0}
              max={data.vcpus_max || 0}
              format="ratio"
              higherIsBetter={true}
              thresholds={{ good: 60, warn: 30 }} // good >= 60%, warn >= 30%, bad < 30%
              colors={{
                good: "var(--color-gauge-good)",
                warn: "var(--color-gauge-warning)",
                bad: "var(--color-gauge-critical)",
                track: "var(--color-gauge-track)",
                border: "var(--color-gauge-border)",
              }}
            />
          </div>
          <div className="flex-1 basis-0 min-w-0">
            <SemiGauge
              title="RAM Available"
              label="RAM available"
              value={data.ram_available || 0}
              max={data.ram_max || 0}
              format="ratio"
              higherIsBetter={true}
              thresholds={{ good: 60, warn: 30 }} // good >= 60%, warn >= 30%, bad < 30%
              colors={{
                good: "var(--color-gauge-good)",
                warn: "var(--color-gauge-warning)",
                bad: "var(--color-gauge-critical)",
                track: "var(--color-gauge-track)",
                border: "var(--color-gauge-border)",
              }}
              unit="MB"
            />
          </div>
          <div className="flex-1 basis-0 min-w-0">
            <SemiGauge
              title="Disk Available"
              label="Disk available"
              value={data.disk_available || 0}
              max={data.disk_max || 0}
              unit="GB"
              format="ratio"
              higherIsBetter={true}
              thresholds={{ good: 60, warn: 30 }} // good >= 60%, warn >= 30%, bad < 30%
              colors={{
                good: "var(--color-gauge-good)",
                warn: "var(--color-gauge-warning)",
                bad: "var(--color-gauge-critical)",
                track: "var(--color-gauge-track)",
                border: "var(--color-gauge-border)",
              }}
              className="text-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
