const AdminTag = "(ADMIN)";
const AgentTag = "(AGENT)";

const swaggerTags = {
  AUTH: "Authentication",
  USER: "Users",
  SERVERS: "Servers",
  VIRTUAL_MACHINES: "Virtual Machines",
  VIRTUAL_MACHINES_SUBUSERS: "Virtual Machines (SubUsers)",
  OS: "Operating Systems",
  CSRF: "CSRF",
  WS: "WebSocket",
  ADMIN: {
    USERS: `${AdminTag} Users`,
    SERVERS: `${AdminTag} Servers`,
    VIRTUAL_MACHINES: `${AdminTag} Virtual Machines`,
  },
  AGENT: {
    IMAGES: `${AgentTag} Images`,
  },
};

export default swaggerTags;
