import db from "@/db/database";
import type { FastifyPluginAsync } from "fastify";
import authRoute from "./auth/auth.route";
import serversRoute from "./servers/servers.route";
import usersRoute from "./user/user.route";
import z from "zod";
import vmsRoute from "./virtual_machines/vm.route";
import adminRouter from "./admin/router";
import swaggerTags from "@/types/swaggerTags";
import agentRoute from "./agent/router";

const v1Router: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               CSRF Protection                              */
  /* -------------------------------------------------------------------------- */
  fastify.get(
    "/csrf",
    {
      schema: {
        tags: [swaggerTags.CSRF],
        summary: "Get CSRF Token",
        description:
          "Generates and returns a CSRF token. Sets a secret cookie if missing.",
        response: {
          200: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      const token = reply.generateCsrf(); // sets secret cookie if missing
      return { token };
    }
  );
  /* -------------------------------------------------------------------------- */
  /*                                 Auth Route                                 */
  /* -------------------------------------------------------------------------- */
  fastify.register(authRoute, {
    prefix: "/auth",
  });
  /* -------------------------------------------------------------------------- */
  /*                                    Users                                   */
  /* -------------------------------------------------------------------------- */
  fastify.register(usersRoute, {
    prefix: "/user",
  });
  /* -------------------------------------------------------------------------- */
  /*                                Servers Route                               */
  /* -------------------------------------------------------------------------- */
  fastify.register(serversRoute, {
    prefix: "/servers",
  });
  /* -------------------------------------------------------------------------- */
  /*                              Virtual Machines                              */
  /* -------------------------------------------------------------------------- */
  fastify.register(vmsRoute, {
    prefix: "/vms",
  });
  /* -------------------------------------------------------------------------- */
  /*                                Admin Router                                */
  /* -------------------------------------------------------------------------- */
  fastify.register(adminRouter, {
    prefix: "/admin",
  });
  /* -------------------------------------------------------------------------- */
  /*                                Agent Router                                */
  /* -------------------------------------------------------------------------- */
  fastify.register(agentRoute, {
    prefix: "/agent",
  });
};

export default v1Router;
