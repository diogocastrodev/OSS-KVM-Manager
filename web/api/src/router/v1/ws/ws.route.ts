import swaggerTags from "@/types/swaggerTags";
import type { FastifyInstance } from "fastify";
import type { WsCreateSSHTerminalQuery } from "./ws.schema";
import { wsSSHTerminal } from "./ws.controller";

const wsRouter = (fastify: FastifyInstance) => {
  fastify.get<{
    Querystring: WsCreateSSHTerminalQuery;
  }>(
    "/sshterm",
    {
      websocket: true,
      schema: {
        description: "WebSocket endpoint for SSH terminal access",
        tags: [swaggerTags.WS, swaggerTags.VIRTUAL_MACHINES],
      },
    },
    wsSSHTerminal
  );
};

export default wsRouter;
