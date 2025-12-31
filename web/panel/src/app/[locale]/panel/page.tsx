import Logo from "@/components/Icon/Logo";

export default function Page() {
  return (
    <>
      <div className="flex-1 flex flex-col p-2 pb-0">
        {/* <div className="flex flex-row w-full h-16">
          <div className="w-60 h-full flex flex-row items-center justify-center gap-x-1.5">
            <Logo props={{ className: "size-14" }} />
            <span className="font-semibold text-2xl">Serverseer</span>
          </div>
          <div className="flex-1 flex flex-row px-2">
            <div className="w-full flex flex-row gap-x-3 items-center font-semibold">
              <div>Dashboard</div>
              <div>Dashboard</div>
              <div>Dashboard</div>
            </div>
            <div className="ml-auto flex flex-row gap-x-2 items-center">
              <div className="bg-zinc-500 w-10 h-10 rounded-full"></div>
            </div>
          </div>
        </div> */}
        <div className="flex-1 flex flex-row">
          <div className="w-60 h-full flex flex-col gap-y-2 p-1 pr-3 pb-3">
            <div className="flex flex-row items-center justify-center gap-x-1.5 mb-4">
              <Logo props={{ className: "size-14" }} />
              <span className="font-semibold text-2xl">Serverseer</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <div className="text-xl font-semibold">Panel</div>
              <div className="text-xl font-semibold">Admin</div>
              <div className="my-4"></div>
              <div className="text-sm font-semibold">Datacenters</div>
              <div className="flex flex-col gap-y-2">
                <div>EU-UK-1</div>
                <div className="pl-4 flex flex-col gap-y-2">
                  <div className="flex flex-col gap-y-1">
                    <div>Server 1</div>
                    <div className="pl-4 flex flex-col gap-y-1">
                      <div>Virtual Machine 1</div>
                      <div>Virtual Machine 2</div>
                      <div>Virtual Machine 3</div>
                      <div>Virtual Machine 4</div>
                      <div>Virtual Machine 5</div>
                      <div>Virtual Machine 6</div>
                    </div>
                  </div>
                  <div className="">Server 2</div>
                  <div className="">Server 3</div>
                  <div className="">Server 4</div>
                </div>
              </div>
            </div>
            <div className="flex mt-auto">
              <div className="w-full h-12 bg-zinc-800 flex flex-row rounded-lg">
                <div className="p-2 flex items-center justify-center">
                  <div className="w-8 h-8 bg-zinc-600 rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center pl-1">
                  <span className="text-base text-zinc-300 ">Diogo</span>
                  <span className="text-xs text-zinc-500">Email</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-(--color-background-secondary) rounded-t-lg overflow-y-auto p-1"></div>
        </div>
      </div>
    </>
  );
}
