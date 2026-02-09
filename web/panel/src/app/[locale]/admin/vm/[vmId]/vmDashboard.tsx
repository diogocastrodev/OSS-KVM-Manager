"use client";

import ChartExample from "@/components/Chart/ChartExample";
import CPUChart from "@/components/Chart/CPUChart";
import MemoryChart from "@/components/Chart/MemoryChart";
import VMNavbar from "@/components/vm/navbar/navbar";
import VMTitle from "@/components/vm/title/title";
import { apiFetch } from "@/lib/apiFetch";
import generalFetch from "@/lib/fetches/generalFetch";
import qk from "@/lib/fetches/keys";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface props {
  vmID: string;
  translations: {
    states: {
      pretext: string;
      shutoff: string;
      running: string;
      stopped: string;
      paused: string;
      unknown: string;
    };
    buttons: {
      start: string;
      shutdown: string;
      restart: string;
      kill: string;
    };
    banner: {
      title: string;
      vcpus: string;
      memory: string;
      disk: string;
      inout: string;
      ips: {
        title: string;
        local: string;
        public: string;
      };
    };
    graphs: {
      title: string;
      cpuTitle: string;
      cpuLabel: string;
      memoryTitle: string;
      memoryLabel: string;
    };
  };
}

export default function VMDashboard({ vmID, translations }: props) {
  const [previousState, setPreviousState] = useState<string | null>(null);
  const [poll, setPoll] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.api.v1.admin.vms.getById(parseInt(vmID)),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/vms/${vmID}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
    refetchInterval: poll ? 5000 : 30_000,
    refetchIntervalInBackground: true,
  });

  const desiredStatesByAction: Record<string, string[]> = {
    start: ["running"],
    restart: ["running"],
    stop: ["stopped", "shutoff"],
    kill: ["stopped", "shutoff"],
  };

  const [desiredStates, setDesiredStates] = useState<string[] | null>(null);

  const changeStateHandler = (action: string) => {
    if (
      data?.status !== "OPERATIONAL" ||
      data?.state === "unknown" ||
      !desiredStatesByAction[action]
    ) {
      toast.error("VM is currently not operational. Please wait...");
      return;
    }
    setPreviousState(data?.state ?? null);
    setDesiredStates(desiredStatesByAction[action] ?? null);
    setPoll(true);
    refetch();
    changeState.mutate(action);
  };

  const changeState = useMutation({
    mutationKey: qk.api.v1.vms.changeState(parseInt(vmID)),
    mutationFn: async (action: string) => {
      return apiFetch(`/api/v1/vms/${vmID}/state`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }).then((res) => res.json());
    },

    onSuccess: () =>
      toast.success("State change initiated. Refreshing status..."),
    onError: () => {
      toast.error("Failed to change state. Please try again.");
      setPoll(false);
      setDesiredStates(null);
    },
  });

  useEffect(() => {
    if (!poll) return;
    if (!data) return;

    const reachedDesired = !desiredStates || desiredStates.includes(data.state);

    const operational = data.status === "OPERATIONAL";

    if (reachedDesired && operational) {
      setPoll(false);
      setDesiredStates(null);
    }
  }, [poll, data?.state, data?.status, desiredStates]);

  useEffect(() => {
    if (!poll) return;
    const t = setTimeout(() => setPoll(false), 60_000); // 1 min
    return () => clearTimeout(t);
  }, [poll]);

  return (
    <>
      <div className="h-full flex flex-col gap-y-5">
        <div className="flex flex-row gap-x-2 items-center">
          {data?.state === "running" && data?.status === "OPERATIONAL" ? (
            <div className="bg-green-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
          ) : (
            <div className="bg-red-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
          )}
          <span>
            {translations.states.pretext}{" "}
            {
              translations.states[
                data?.state as keyof typeof translations.states
              ]
            }
          </span>
          {data?.status !== "OPERATIONAL" && (
            <>
              <div className="bg-yellow-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
              <span className="text-sm text-(--color-foreground-secondary)">
                ({data?.status})
              </span>
            </>
          )}
        </div>
        <div className="flex gap-x-3">
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-not-allowed bg-(--color-button-turnon-disabled) text-(--color-button-turnon-foreground-disabled)` : `cursor-pointer bg-(--color-button-turnon) hover:bg-(--color-button-turnon-hover) text-(--color-button-turnon-foreground) hover:text-(--color-button-turnon-foreground-hover)`}`}
            disabled={
              data?.state === "running" || data?.status !== "OPERATIONAL"
            }
            onClick={() => changeStateHandler("start")}
          >
            {translations.buttons.start}
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-turnoff) hover:bg-(--color-button-turnoff-hover) text-(--color-button-turnoff-foreground) hover:text-(--color-button-turnoff-foreground-hover)` : `cursor-not-allowed bg-(--color-button-turnoff-disabled) text-(--color-button-turnoff-foreground-disabled)`}`}
            disabled={
              data?.state !== "running" || data?.status !== "OPERATIONAL"
            }
            onClick={() => changeStateHandler("stop")}
          >
            {translations.buttons.shutdown}
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-restart) hover:bg-(--color-button-restart-hover) text-(--color-button-restart-foreground) hover:text-(--color-button-restart-foreground-hover)` : `cursor-not-allowed bg-(--color-button-restart-disabled) text-(--color-button-restart-foreground-disabled)`}`}
            disabled={
              data?.state !== "running" || data?.status !== "OPERATIONAL"
            }
            onClick={() => changeStateHandler("restart")}
          >
            {translations.buttons.restart}
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-kill) hover:bg-(--color-button-kill-hover) text-(--color-button-kill-foreground) hover:text-(--color-button-kill-foreground-hover)` : `cursor-not-allowed bg-(--color-button-kill-disabled) text-(--color-button-kill-foreground-disabled)`}`}
            disabled={
              data?.state !== "running" || data?.status !== "OPERATIONAL"
            }
            onClick={() => changeStateHandler("kill")}
          >
            {translations.buttons.kill}
          </button>
        </div>
        <div className="border-b-2 border-(--color-background-primary)"></div>
        <div className="flex flex-col gap-y-2">
          <div className="text-xl">{translations.banner.title}:</div>
          <div className="flex flex-row justify-around items-center w-full bg-(--color-background-primary) p-4 rounded-2xl shadow-lg">
            <div className="flex flex-col">
              <div className="text-lg text-center">
                {translations.banner.vcpus}
              </div>
              <div className="text-2xl font-bold text-center">
                {data?.vcpus}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">
                {translations.banner.memory}
              </div>
              <div className="text-2xl font-bold text-center">
                {data?.ram} MB
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">
                {translations.banner.disk}
              </div>
              <div className="text-2xl font-bold text-center">
                {data?.disk} GB
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">
                {translations.banner.inout}
              </div>
              <div className="text-2xl font-bold text-center flex flex-col">
                {data?.in_avg} / {data?.out_avg}
                <span className="text-sm font-light text-(--color-foreground-secondary)">
                  Mbps
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">
                {translations.banner.ips.title}
              </div>
              <div className="flex flex-col text-md font-bold text-center">
                <span>
                  <span className="text-xs mr-1 text-(--color-foreground-secondary)">
                    {translations.banner.ips.local}:
                  </span>
                  {data?.ipLocal || "N/A"}
                </span>
                <span>
                  <span className="text-xs mr-1 text-(--color-foreground-secondary)">
                    {translations.banner.ips.public}:
                  </span>
                  {data?.ipPublic || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full h-full flex flex-col gap-y-3">
          <div className="text-xl">{translations.graphs.title}:</div>
          <div className="flex w-full flex-col md:flex-row gap-y-4 md:gap-x-4">
            <div className="border rounded-2xl w-full">
              <CPUChart
                labelText={translations.graphs.cpuLabel}
                title={translations.graphs.cpuTitle}
                data={[10, 25, 40, 30, 50]}
                labels={["10:00", "10:05", "10:10", "10:15", "10:20"]}
              />
            </div>
            <div className="border rounded-2xl w-full h-full">
              <MemoryChart
                title={translations.graphs.memoryTitle}
                labelText={translations.graphs.memoryLabel}
                data={[350, 1024, 2040, 1536, 2010]}
                labels={["10:00", "10:05", "10:10", "10:15", "10:20"]}
                maxValue={data?.ram ? data.ram : 100}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
  /*
  return (
    <>
        <div className="p-5">
            <VMNavbar publicId={query.data.publicId}/>
            <div className="pt-10 flex flex-col gap-y-10">
                <div className="flex gap-x-3 w-1/2">
                    <button className="flex-1 border rounded-2xl h-12 bg-(--color-button-turnon)">Iniciar</button>
                    <button className="flex-1 border rounded-2xl bg-auto h-12">Desligar</button>
                    <button className="flex-1 border rounded-2xl bg-auto h-12">Reiniciar</button>
                    <button className="flex-1 border rounded-2xl bg-auto h-12">Kill</button>
                </div>
                <div className="flex gap-x-10">
                    <div className="flex-1 border rounded-4xl">
                        Gráfico 1
                    </div>
                    <div className="flex-1 border rounded-4xl">
                        Gráfico 2
                    </div>
                </div>
            </div>
        </div>
    </>
  );*/
}
