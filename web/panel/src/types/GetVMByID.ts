interface UserGetVMByIDResponse {
  createdAt: Date;
  disk: number;
  in_avg: number;
  ipLocal: string;
  ipPublic: string | null;
  mac: string;
  name: string;
  out_avg: number;
  publicId: number;
  ram: number;
  role: "OWNER" | "OPERATOR" | "VIEWER";
  state: "running" | "stopped" | "paused" | "unknown";
  updatedAt: Date;
  vcpus: number;
}
