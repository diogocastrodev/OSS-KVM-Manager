type Method = "GET" | "POST" | "PUT" | "DELETE";

export type RouteDef<
  M extends Method,
  Path extends string,
  Reply,
  Body = never,
> = {
  method: M;
  path: Path;
  reply: Reply;
} & ([Body] extends [never] ? {} : { body: Body });

type PathParamKeys<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | PathParamKeys<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

export type ParamsFor<Path extends string> = [PathParamKeys<Path>] extends [
  never,
]
  ? never
  : { [K in PathParamKeys<Path>]: string };

export type PreparedRequest<R extends { method: any; path: string }> = {
  method: R["method"];
  path: R["path"];
} & (R extends { body: infer B } ? { body: B } : {}) &
  (ParamsFor<R["path"]> extends never ? {} : { params: ParamsFor<R["path"]> });
// --- Domain models ---
export interface CreateVMBody {
  vm_id: string;
  vm: {
    vcpus: number;
    memory: number;
    disk_size: number;
    network: {
      in_avg_mbps: number;
      in_peak_mbps: number;
      in_burst_mbps: number;
      out_avg_mbps: number;
      out_peak_mbps: number;
      out_burst_mbps: number;
    };
    mac: string;
  };
}

export interface FormatVMBody {
  mode: "cloud" | "iso";
  vm_id: string;
  host?: {
    hostname: string;
    username: string;
    password?: string | undefined;
    public_key?: string | undefined;
  };
  network?: {
    mac_address: string;
    ip_cidr: string;
    gateway: string;
    dns_servers: string[];
  };
  os: {
    os_name: string;
    os_url: string;
    os_checksum?: string;
  };
}

export interface FinalizeVMBody {
  seed_iso_path?: string;
  delete_iso?: boolean; // Default true
}

// --- Route types ---
export namespace Health {
  export type Check = RouteDef<"GET", "/api/v1/health", { status: "ok" }>;
}

export namespace Utils {
  export type RandomUUID = RouteDef<"GET", "/api/v1/uuid", { uuid: string }>;
}

export namespace VMs {
  export type List = RouteDef<
    "GET",
    "/api/v1/vms",
    {
      vms: Array<{ id: string; name: string; status: string }>;
    }
  >;

  export type Create = RouteDef<
    "POST",
    "/api/v1/vms",
    { message: string },
    CreateVMBody
  >;

  export type Get = RouteDef<
    "GET",
    "/api/v1/vms/:vm_id",
    { id: string; name: string; status: string }
  >;

  export type Status = RouteDef<
    "GET",
    "/api/v1/vms/:vm_id/status",
    { status: string }
  >;

  export type Start = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/start",
    { message: string }
  >;

  export type Stop = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/stop",
    { message: string }
  >;

  export type Restart = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/restart",
    { message: string }
  >;

  export type Kill = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/kill",
    { message: string }
  >;

  export type Format = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/format",
    { message: string },
    FormatVMBody
  >;

  export type Finalize = RouteDef<
    "POST",
    "/api/v1/vms/:vm_id/finalize",
    { message: string },
    FinalizeVMBody
  >;
}

export type AgentRoutes = {
  healthCheck: Health.Check;
  randomUUID: Utils.RandomUUID;

  listVMs: VMs.List;
  createVM: VMs.Create;
  getVM: VMs.Get;

  getVMStatus: VMs.Status;
  startVM: VMs.Start;
  stopVM: VMs.Stop;
  restartVM: VMs.Restart;
  killVM: VMs.Kill;

  formatVM: VMs.Format;
  finalizeVM: VMs.Finalize;
};

type AnyRoute = RouteDef<Method, string, any, any>;

export type RouteName = keyof AgentRoutes;

export type ReplyOf<K extends RouteName> = AgentRoutes[K]["reply"];

export type BodyOf<K extends RouteName> = AgentRoutes[K] extends {
  body: infer B;
}
  ? B
  : never;

export type ParamsOf<K extends RouteName> = ParamsFor<AgentRoutes[K]["path"]>;

export type PathOf<K extends RouteName> = AgentRoutes[K]["path"];
