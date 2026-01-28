'use client';

import { usePathname } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { useSession } from "@/hooks/useSession";
import VMTitleServer from "../title/TitleServer";

interface props{
    publicId: number
}



export default function VMNavbarAdminServer(props: props) {
  const path = usePathname();
  const session2 = useSession();


    const {data, isLoading} = useQuery({
        queryKey: [`getVMById-`+props.publicId],
        queryFn: async () => {
                    const d = await apiFetch(`/api/v1/admin/servers/${props.publicId}`)
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
            <VMTitleServer name={data.server.name} publicId={data.server.publicId} />
        </div>
    </>
  );
}
