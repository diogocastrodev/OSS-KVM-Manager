import type { FastifyPluginAsync } from "fastify";
import v1Router from "./v1/router";

const apiRouter: FastifyPluginAsync = async (fastify) => {
  fastify.register(v1Router, { prefix: "/v1" });
};

export default apiRouter;
