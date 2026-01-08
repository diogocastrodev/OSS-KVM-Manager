import type { FastifyPluginAsync } from "fastify";
import agentOsRoute from "./os/os.route";

const agentRoute: FastifyPluginAsync = async (fastify) => {
  fastify.register(agentOsRoute, { prefix: "/os" });
};
export default agentRoute;
