import type { FastifyPluginAsync } from "fastify";
import vmAdminRoute from "./virtual_machines/vm.route";

const adminRouter: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                              Virtual Machines                              */
  /* -------------------------------------------------------------------------- */
  fastify.register(vmAdminRoute, { prefix: "/vms" });
};

export default adminRouter;
