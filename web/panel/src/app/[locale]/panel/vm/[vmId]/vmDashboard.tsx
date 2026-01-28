"use client";

import ChartExample from "@/components/Chart/ChartExample";
import VMNavbar from "@/components/vm/navbar/navbar";
import VMTitle from "@/components/vm/title/title";
import { apiFetch } from "@/lib/apiFetch";
import generalFetch from "@/lib/fetches/generalFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";

interface props {
  vmID: string;
}

export default function VMDashboard({ vmID }: props) {
  const { data, isLoading } = useQuery({
    queryKey: qk.api.v1.vms.getVMById(parseInt(vmID)),
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/vms/${vmID}`);
      return d.json() as Promise<UserGetVMByIDResponse>;
    },
    staleTime: 60_000,
  });

  return (
    <>
      <div className="h-full flex flex-col gap-y-5">
        <div className="flex flex-row gap-x-2 items-center">
          {data?.state === "running" ? (
            <div className="bg-green-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
          ) : (
            <div className="bg-red-500 animate-pulse duration-200 w-4 h-4 rounded-full"></div>
          )}
          <span>The machine is currently {data?.state}</span>
        </div>
        <div className="flex gap-x-3">
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-not-allowed bg-(--color-button-turnon-disabled) text-(--color-button-turnon-foreground-disabled)` : `cursor-pointer bg-(--color-button-turnon) hover:bg-(--color-button-turnon-hover) text-(--color-button-turnon-foreground) hover:text-(--color-button-turnon-foreground-hover)`}`}
          >
            Start
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-turnoff) hover:bg-(--color-button-turnoff-hover) text-(--color-button-turnoff-foreground) hover:text-(--color-button-turnoff-foreground-hover)` : `cursor-not-allowed bg-(--color-button-turnoff-disabled) text-(--color-button-turnoff-foreground-disabled)`}`}
          >
            Shutdown
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-restart) hover:bg-(--color-button-restart-hover) text-(--color-button-restart-foreground) hover:text-(--color-button-restart-foreground-hover)` : `cursor-not-allowed bg-(--color-button-restart-disabled) text-(--color-button-restart-foreground-disabled)`}`}
          >
            Restart
          </button>
          <button
            className={`rounded-md shadow-lg px-4 py-2 ${data?.state === "running" ? `cursor-pointer bg-(--color-button-kill) hover:bg-(--color-button-kill-hover) text-(--color-button-kill-foreground) hover:text-(--color-button-kill-foreground-hover)` : `cursor-not-allowed bg-(--color-button-kill-disabled) text-(--color-button-kill-foreground-disabled)`}`}
          >
            Kill
          </button>
        </div>
        <div className="border-b-2 border-(--color-background-primary)"></div>
        <div className="flex flex-col gap-y-2">
          <div className="text-xl">Your VM Resources:</div>
          <div className="flex flex-row justify-around w-full bg-(--color-background-primary) p-4 rounded-2xl shadow-lg">
            <div className="flex flex-col">
              <div className="text-lg text-center">vCPUs</div>
              <div className="text-2xl font-bold text-center">
                {data?.vcpus}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">Memory</div>
              <div className="text-2xl font-bold text-center">
                {data?.ram} MB
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">Disk</div>
              <div className="text-2xl font-bold text-center">
                {data?.disk} GB
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">In/Out</div>
              <div className="text-2xl font-bold text-center">
                {data?.in_avg} / {data?.out_avg} Mbps
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg text-center">IP Address</div>
              <div className="text-2xl font-bold text-center">
                {data?.ipPublic || "N/A"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full h-full flex flex-col gap-y-3">
          <div className="text-xl">Some Information:</div>
          <div className="flex w-full flex-col md:flex-row gap-y-4 md:gap-x-4">
            <div className="border rounded-2xl w-full">
              <ChartExample />
            </div>
            <div className="border rounded-2xl w-full h-full">
              <ChartExample />
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
