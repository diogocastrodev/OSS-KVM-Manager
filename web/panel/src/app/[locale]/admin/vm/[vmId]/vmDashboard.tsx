'use client';

import VMNavbar from "@/components/vm/navbar/navbar";
import VMTitle from "@/components/vm/title/title"
import { apiFetch } from "@/lib/apiFetch"
import { useQuery } from "@tanstack/react-query"

interface props {
    vmID: string
}

interface Response {
    name: string
}

export default function VMDashboard({vmID}: props){
    /*
    const query = useQuery({
        queryKey: [`getVMById`+vmID],
        queryFn: async () => {
            const d = await apiFetch(`/api/v1/admin/vms/${vmID}`)
            return d.json()
        }
    })

    if (query.isLoading) {
        return <>
        <div>Loading...</div>
        </>
    }*/


    return <div className="pt-10 flex flex-col gap-y-10">
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