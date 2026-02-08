/**
 * Query keys for react-query
 */
const qk = {
  api: {
    v1: {
      auth: {
        login: () => ["api", "v1", "auth", "login"] as const,
        logout: () => ["api", "v1", "auth", "logout"] as const,
        requestPasswordReset: () =>
          ["api", "v1", "auth", "requestPasswordReset"] as const,
        passwordReset: () => ["api", "v1", "auth", "passwordReset"] as const,
        checkEmailToken: () =>
          ["api", "v1", "auth", "checkEmailToken"] as const,
        confirmEmail: () => ["api", "v1", "auth", "confirmEmail"] as const,
      },
      user: {
        session: () => ["api", "v1", "user", "session"] as const,
        profile: () => ["api", "v1", "user", "profile"] as const,
      },
      server: {
        myServers: () => ["api", "v1", "server", "myServers"] as const,
      },
      vms: {
        getVMs: () => ["api", "v1", "vms", "getVMs"] as const,
        getVMById: (vmId: number) =>
          ["api", "v1", "vms", "getVMById", vmId] as const,
        changeState: (vmId: number) =>
          ["api", "v1", "vms", "changeState", vmId] as const,
        subUsers: {
          getAllSubUsers: (vmId: number) =>
            ["api", "v1", "vms", "subUsers", "getAllSubUsers", vmId] as const,
          createSubUser: (vmId: number) =>
            ["api", "v1", "vms", "subUsers", "createSubUser", vmId] as const,
          updateSubUser: (vmId: number) =>
            ["api", "v1", "vms", "subUsers", "updateSubUser", vmId] as const,
          deleteSubUser: (vmId: number) =>
            ["api", "v1", "vms", "subUsers", "deleteSubUser", vmId] as const,
        },
      },
      os: {
        getAllOS: () => ["api", "v1", "os", "getAllOS"] as const,
      },
      admin: {
        users: {
          all: () => ["api", "v1", "admin", "users", "all"] as const,

          getById: (userId: number) =>
            ["api", "v1", "admin", "users", "getById", userId] as const,
          getByPage: ({
            page = 1,
            limit = 10,
            search = undefined,
          }: {
            page: number;
            limit: number;
            search?: string;
          }) =>
            [
              "api",
              "v1",
              "admin",
              "users",
              "getByPage",
              { page, limit, search },
            ] as const,
          create: () => ["api", "v1", "admin", "users", "create"] as const,
          update: (userId: number) =>
            ["api", "v1", "admin", "users", "update", userId] as const,
          delete: (userId: number) =>
            ["api", "v1", "admin", "users", "delete", userId] as const,
        },
        servers: {
          all: () => ["api", "v1", "admin", "server", "all"] as const,
          allHealth: () =>
            ["api", "v1", "admin", "server", "allHealth"] as const,
          getById: (vmId: number) =>
            ["api", "v1", "admin", "server", "getById", vmId] as const,
          getVMs: (serverId: number) =>
            ["api", "v1", "admin", "server", "getVMs", serverId] as const,
          tryInfo: () => ["api", "v1", "admin", "server", "tryInfo"] as const,
          create: () => ["api", "v1", "admin", "server", "create"] as const,
          update: (vmId: number) =>
            ["api", "v1", "admin", "server", "update", vmId] as const,
          delete: (vmId: number) =>
            ["api", "v1", "admin", "server", "delete", vmId] as const,
          healthcheck: (vmId: number) =>
            ["api", "v1", "admin", "server", "healthcheck", vmId] as const,
        },
        vms: {
          all: () => ["api", "v1", "admin", "vms", "all"] as const,
          getById: (vmId: number) =>
            ["api", "v1", "admin", "vms", "getById", vmId] as const,
          create: () => ["api", "v1", "admin", "vms", "create"] as const,
          update: (vmId: number) =>
            ["api", "v1", "admin", "vms", "update", vmId] as const,
          delete: (vmId: number) =>
            ["api", "v1", "admin", "vms", "delete", vmId] as const,
        },
      },
    },
  },
};

export default qk;
