import type { FastifyPluginAsync } from "fastify";
import vmAdminRoute from "./virtual_machines/vm.route";
import userAdminRoute from "./user/user.route";
import serversAdminRoute from "./servers/servers.route";

const adminRouter: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                                    Users                                   */
  /* -------------------------------------------------------------------------- */
  fastify.register(userAdminRoute, { prefix: "/users" });
  /* -------------------------------------------------------------------------- */
  /*                                   Servers                                  */
  /* -------------------------------------------------------------------------- */
  fastify.register(serversAdminRoute, { prefix: "/servers" });
  /* -------------------------------------------------------------------------- */
  /*                              Virtual Machines                              */
  /* -------------------------------------------------------------------------- */
  fastify.register(vmAdminRoute, { prefix: "/vms" });
};

export default adminRouter;
