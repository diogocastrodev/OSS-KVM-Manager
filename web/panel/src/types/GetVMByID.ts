interface UserGetVMByIDResponse {
  createdAt: Date;
  disk: number;
  ipLocal: string;
  ipPublic: string | null;
  mac: string;
  name: string;
  in_avg: number;
  in_peak: number;
  in_burst: number;
  out_peak: number;
  out_burst: number;
  out_avg: number;
  publicId: number;
  ram: number;
  role: "OWNER" | "OPERATOR" | "VIEWER";
  state: "running" | "stopped" | "paused" | "unknown" | "shutoff";
  status:
    | "CREATING"
    | "RUNNING"
    | "STOPPED"
    | "SUSPENDED"
    | "FORMATTING"
    | "DELETING"
    | "FAILED"
    | "OPERATIONAL";
  updatedAt: Date;
  vcpus: number;
}

interface AdminGetVMByIDResponse extends UserGetVMByIDResponse {
  include_server: {
    serverAgentPort: number;
    serverIpLocal: string;
    serversDiskAvailable: number;
    serversInLinkSpeedMbps: number;
    serversOutLinkSpeedMbps: number;
    serversRamAvailable: number;
    serversVcpusAvailable: number;
    serversVmsGateway: string;
    serversVmsNetworkMask: string;
    serversVmsNetwork: string;
  };
}
