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
import wsRouter from "./ws/ws.route";
import osRoute from "./os/os.route";

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
    },
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
  /*                                     OS                                     */
  /* -------------------------------------------------------------------------- */
  fastify.register(osRoute, {
    prefix: "/os",
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
  /* -------------------------------------------------------------------------- */
  /*                                  WS Router                                 */
  /* -------------------------------------------------------------------------- */
  fastify.register(wsRouter, {
    prefix: "/ws",
  });

  fastify.get("/aaaa", async (req, reply) => {
    const servers = await db.selectFrom("servers").selectAll().execute();

    const b = await Promise.all(
      servers.map(async (server) => {
        return await fetch(
          `http://${server.ipLocal}:${server.agent_port}/api/v1/my-ip`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(2500), // 5 second timeout
          },
        )
          .then((res) => res.json())
          .then((data) => {
            console.log(`Server ${server.publicId} is ${data.status}`);
            return {
              serverIP: server.ipLocal,
              status: data.status,
              rest_data: { ...data },
            };
          })
          .catch((err) => {
            console.error(`Failed to ping server ${server.publicId}:`, err);
          });
      }),
    );
    return { message: "Pinging servers...", data: b };
  });
};

export default v1Router;
