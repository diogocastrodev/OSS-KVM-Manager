import { apiFetch } from "../apiFetch";
import { apiFetchServer } from "../apiFetchServer";

enum VirtualMachineStatus {
  CREATING = "CREATING",
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  SUSPENDED = "SUSPENDED",
  FORMATTING = "FORMATTING",
  DELETING = "DELETING",
  FAILED = "FAILED",
  OPERATIONAL = "OPERATIONAL",
}

export interface myVMsResponse {
    servers: [{
        publicId: number;
        name: string;
        virtual_machines?: [{
            publicId: number;
            name: string;
            status: VirtualMachineStatus
        }]
    }]
}

export async function fetchMyVMs () {
    const r = await apiFetch("/api/v1/servers?include_virtual_machines=true")
    if (!r) throw new Error("Failed to fetch My VMs")
    return r.json() as Promise<myVMsResponse>;
}

export async function fetchAllVMs () {
    const r = await apiFetch("/api/v1/admin/servers?include_virtual_machines=true")
    if (!r) throw new Error("Failed to fetch My VMs")
    return r.json() as Promise<myVMsResponse>;
}