"use client";
import SemiGauge from "@/components/Gauge/GaugeExample";
import { ServerData } from "@/components/vm/navbar/navbarAdminServer";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface props {
  serverId: string;
  translations: {
    title: string;
    statusMsg: string;
    agentMsg: string;
    healthCheck: {
      msg: string;
      button: string;
      success: string;
      error: string;
    };
    resources: {
      title: string;
      vcpusTitle: string;
      vcpusLabel: string;
      memoryTitle: string;
      memoryLabel: string;
      diskTitle: string;
      diskLabel: string;
    };
    status: {
      active: string;
      maintenance: string;
      disabled: string;
    };
  };
}

export default function ServerPageClient(props: props) {
  const { serverId } = props;
  const { translations: t } = props;

  const { data: healthCheck, refetch: healthCheckRefetch } = useQuery({
    queryKey: [qk.api.v1.admin.servers.healthcheck(parseInt(serverId))],
    queryFn: async () => {
      const d = await apiFetch(
        `/api/v1/admin/servers/${serverId}/health-check`,
        {
          method: "POST",
        },
      );
      const da = (await d.json()) as { alive: boolean };
      if (!d.ok) {
        toast.error(t.healthCheck.error);
      } else {
        toast.success(t.healthCheck.success);
      }
      return da;
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
          {t.statusMsg}:
          <span className="capitalize pl-1">
            {data &&
              t.status[data.status.toLowerCase() as keyof typeof t.status]}
          </span>
        </div>
        <div>
          {t.agentMsg}:
          <span className="font-mono pl-1">
            {data?.ipLocal}:{data?.agent_port}
          </span>
        </div>
        <div className="flex flex-row">
          {t.healthCheck.msg}:
          <button
            className="pl-1 italic underline"
            onClick={() => healthCheckRefetch()}
          >
            {t.healthCheck.button}
          </button>
          <div className="pl-4">
            {healthCheck && (
              <span className="flex flex-row items-center pl-4">
                {healthCheck !== undefined ? (
                  healthCheck.alive ? (
                    <>
                      <div className="text-(--color-text-success) flex flex-row items-center gap-x-1">
                        <div className="w-3 h-3 bg-(--color-traffic-green) rounded-full animate-pulse duration-1000"></div>
                        {t.healthCheck.success}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-(--color-text-error) flex flex-row items-center gap-x-1">
                        <div className="w-3 h-3 bg-(--color-traffic-red) rounded-full animate-pulse duration-1000"></div>
                        {t.healthCheck.error}
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
      <div className="text-xl pt-4">{t.resources.title}</div>
      {data && (
        <div className="w-full flex flex-row gap-x-4 bg-(--color-background-primary) p-4 rounded">
          <div className="flex-1 basis-0 min-w-0">
            <SemiGauge
              title={t.resources.vcpusTitle}
              label={t.resources.vcpusLabel}
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
              title={t.resources.memoryTitle}
              label={t.resources.memoryLabel}
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
              title={t.resources.diskTitle}
              label={t.resources.diskLabel}
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
