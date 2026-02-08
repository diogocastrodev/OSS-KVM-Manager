import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { WsCreateSSHTerminalQuery } from "./ws.schema";
import {
  decryptVirtualSessionEncryptToken,
  rawDataToBuffer,
} from "@/utils/vmConsole";
import WS from "ws";
import type { RawData } from "ws";

export const wsSSHTerminal = (
  conn: WebSocket,
  req: FastifyRequest<{ Querystring: WsCreateSSHTerminalQuery }>,
) => {
  const token = req.query.token;
  if (!token) return conn.close(1008, "Missing token");

  const pending: Buffer[] = [];
  let pendingBytes = 0;
  const MAX_PENDING = 1024 * 1024;

  let agentWs: WS | null = null;
  let agentReady = false;
  let closed = false;

  const cleanup = (why: string) => {
    if (closed) return;
    closed = true;
    req.log.info({ why }, "sshterm tunnel closed");
    try {
      agentWs?.terminate();
    } catch {}
    try {
      conn.terminate();
    } catch {}
  };

  conn.on("message", (data: RawData) => {
    const buf = rawDataToBuffer(data);

    if (!agentReady) {
      pending.push(buf);
      pendingBytes += buf.length;
      if (pendingBytes > MAX_PENDING)
        cleanup("buffer overflow before agent ready");
      return;
    }

    agentWs!.send(buf);
  });

  conn.on("error", (e: any) => cleanup("ws error: " + (e?.message ?? e)));
  conn.on("close", (code, reason) =>
    cleanup(`ws close: ${code} ${reason?.toString() ?? ""}`),
  );

  (async () => {
    try {
      const decrypted = await decryptVirtualSessionEncryptToken(token);
      if (!decrypted) return conn.close(1008, "Invalid token");

      const agentHost = String(decrypted.agentHost);
      const agentPort = Number(decrypted.agentPort);

      // agent needs a WS endpoint (we’ll add it next)
      const url = `ws://${agentHost}:${agentPort}/api/v1/sshterm/ws`;

      agentWs = new WS(url);
      agentWs.binaryType = "nodebuffer"; // ensures binary arrives as Buffer in Node-style clients :contentReference[oaicite:1]{index=1}

      agentWs.on("open", () => {
        agentWs!.send(
          JSON.stringify({
            vmId: String(decrypted.vm),
            targetHost: String(decrypted.targetHost), // VM IP
            targetPort: Number(decrypted.targetPort), // 22
          }),
        );
      });

      agentWs.on("message", (data, isBinary) => {
        // If you implement an "OK" handshake reply, handle it here.
        if (!agentReady && !isBinary) {
          const txt = data.toString();
          if (txt.startsWith("ERR ")) {
            req.log.error({ txt }, "agent refused/failed");
            cleanup("agent error: " + txt);
            return;
          }
          if (txt === "OK") {
            agentReady = true;
            for (const b of pending) agentWs!.send(b);
            pending.length = 0;
            pendingBytes = 0;
            return;
          }
        }

        // normal stream: agent -> browser
        if (conn.readyState === 1) conn.send(data as any, { binary: true });
      });

      agentWs.on("close", () => cleanup("agent ws closed"));
      agentWs.on("error", (e: any) =>
        cleanup("agent ws error: " + (e?.message ?? e)),
      );
    } catch (e: any) {
      cleanup("setup failed: " + (e?.message ?? e));
    }
  })();
};
