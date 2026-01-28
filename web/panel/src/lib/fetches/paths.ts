const paths = {
  api: {
    v1: {
      servers: {
        myServers: (include_vms: boolean = false) =>
          `/api/v1/servers${include_vms ? "?include_virtual_machines=true" : ""}`,
      },
      vms: {
        myVMs: () => `/api/v1/vms`,
        getVMById: (vmId: string | number) =>
          `/api/v1/vms/${typeof vmId === "string" ? parseInt(vmId) : vmId}`,
      },
      admin: {
        servers: {
          all: (include_vms: boolean = false) =>
            `/api/v1/admin/servers${include_vms ? "?include_virtual_machines=true" : ""}`,
          getById: (serverId: string | number) =>
            `/api/v1/admin/servers/${serverId}`,
        },
        vms: {
          all: () => `/api/v1/admin/vms`,
          getById: (vmId: string | number) =>
            `/api/v1/admin/vms/${typeof vmId === "string" ? parseInt(vmId) : vmId}`,
        },
      },
    },
  },
};

export default paths;
