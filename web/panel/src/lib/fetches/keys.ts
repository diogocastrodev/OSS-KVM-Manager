/**
 * Query keys for react-query
 */
const qk = {
  api: {
    v1: {
      auth: {
        login: () => ["api", "v1", "auth", "login"] as const,
        logout: () => ["api", "v1", "auth", "logout"] as const,
      },
      user: {
        session: () => ["api", "v1", "user", "session"] as const,
      },
      server: {
        myServers: () => ["api", "v1", "server", "myServers"] as const,
      },
      vms: {
        getVMs: () => ["api", "v1", "vms", "getVMs"] as const,
        getVMById: (vmId: number) =>
          ["api", "v1", "vms", "getVMById", vmId] as const,
      },
      admin: {
        servers: {
          all: () => ["api", "v1", "admin", "server", "all"] as const,
          getById: (vmId: number) =>
            ["api", "v1", "admin", "server", "getById", vmId] as const,
        },
        vms: {
          all: () => ["api", "v1", "admin", "vms", "all"] as const,
          getById: (vmId: number) =>
            ["api", "v1", "admin", "vms", "getById", vmId] as const,
        },
      },
    },
  },
};

export default qk;
