'use client';

import { usePathname } from "@/i18n/navigation";
import VMTitle from "../title/title";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { useSession } from "@/hooks/useSession";

interface props{
    publicId: number
}



export default function VMNavbarAdmin(props: props) {
  const path = usePathname();
  const session2 = useSession();


    const {data, isLoading} = useQuery({
        queryKey: [`getVMById-`+props.publicId],
        queryFn: async () => {
                    const d = await apiFetch(`/api/v1/admin/vms/${props.publicId}`)
                    return d.json()
                },
                staleTime: 60_000
    })

    if(!data || isLoading) { return( <>
    <div role="status" className="max-w-sm animate-pulse">
        <div className="h-2.5 bg-slate-200 rounded-full w-48 mb-4"></div>
        <div className="h-2 bg-slate-200 rounded-full max-w-90 mb-2.5"></div>
        <div className="h-2 bg-slate-200 rounded-full mb-2.5"></div>
        <div className="h-2 bg-slate-200 rounded-full max-w-82.5 mb-2.5"></div>
        <div className="h-2 bg-slate-200 rounded-full max-w-75 mb-2.5"></div>
        <div className="h-2 bg-slate-200 rounded-full max-w-90"></div>
        <span className="sr-only">Loading...</span>
    </div>
    </>)}
    console.log(data)
  return (
    <>
        <div className="flex flex-col gap-y-5">
            <VMTitle name={data.name} publicId={data.publicId} />
            <div className="">
                <a href={`/admin/vm/${data.publicId}/`} className={`${path ===`/admin/vm/${data.publicId}` && "underline"}`}>Dashboard</a>
                <a href={`/admin/vm/${data.publicId}/console`} className={`${path ===`/admin/vm/${data.publicId}/console` && "underline"}`}>Consola</a>
                <a href={`/admin/vm/${data.publicId}/format`}  className={`${path ===`/admin/vm/${data.publicId}/format` && "underline"}`}>Formatar</a>
            </div>
        </div>
    </>
  );
}
