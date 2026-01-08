const AdminTag = "(ADMIN)";
const AgentTag = "(AGENT)";

const swaggerTags = {
  AUTH: "Authentication",
  USER: "Users",
  SERVERS: "Servers",
  VIRTUAL_MACHINES: "Virtual Machines",
  CSRF: "CSRF",
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
