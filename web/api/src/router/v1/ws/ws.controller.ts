import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { WsCreateSSHTerminalQuery } from "./ws.schema";
import {
  decryptVirtualSessionEncryptToken,
  rawDataToBuffer,
} from "@/utils/vmConsole";
import net from "node:net";
import type { RawData } from "ws";

export const wsSSHTerminal = (
  conn: WebSocket,
  req: FastifyRequest<{ Querystring: WsCreateSSHTerminalQuery }>
) => {
  const token = req.query.token;
  if (!token) {
    conn.close(1008, "Missing token");
    return;
  }

  // Buffer any WS->TCP data that arrives before TCP is ready.
  const pending: Buffer[] = [];
  let pendingBytes = 0;
  const MAX_PENDING = 1024 * 1024; // 1MB safety cap
  let tcp: net.Socket | null = null;
  let tcpReady = false;
  let closed = false;

  const cleanup = (why: string) => {
    if (closed) return;
    closed = true;
    req.log.info({ why }, "sshterm tunnel closed");
    try {
      tcp?.destroy();
    } catch {}
    try {
      conn.terminate();
    } catch {}
  };

  // Attach WS handlers IMMEDIATELY (before any await)
  let loggedClient = false;

  conn.on("message", (data: RawData) => {
    const buf = rawDataToBuffer(data);

    if (!loggedClient) {
      loggedClient = true;
      req.log.info(
        { firstClient: buf.slice(0, 80).toString("utf8") },
        "first client bytes"
      );
    }

    if (!tcpReady) {
      pending.push(buf);
      pendingBytes += buf.length;
      if (pendingBytes > MAX_PENDING) {
        cleanup("buffer overflow before tcp ready");
      }
      return;
    }

    // Normal path: forward to TCP
    tcp!.write(buf);
  });

  conn.on("error", (e: any) => cleanup("ws error: " + (e?.message ?? e)));
  conn.on("close", (code, reason) =>
    cleanup(`ws close: ${code} ${reason?.toString() ?? ""}`)
  );

  // Async setup: decrypt token -> connect TCP
  (async () => {
    try {
      const decryptedToken = await decryptVirtualSessionEncryptToken(token);
      if (!decryptedToken) {
        conn.close(1008, "Invalid token");
        return;
      }

      const host = String(decryptedToken.targetHost);
      const port = Number(decryptedToken.targetPort);

      tcp = net.connect({ host, port });
      tcp.setNoDelay(true);

      // TCP -> WS (binary)
      tcp.on("data", (chunk: Buffer) => {
        if (conn.readyState === 1) {
          conn.send(chunk, { binary: true });
        }
      });

      tcp.on("error", (e) => cleanup("tcp error: " + e.message));
      tcp.on("close", () => cleanup("tcp closed"));

      tcp.on("connect", () => {
        tcpReady = true;
        req.log.info({ host, port }, "sshterm tcp connected");

        // Flush anything the client sent while we were decrypting/connecting.
        for (const b of pending) tcp!.write(b);
        pending.length = 0;
        pendingBytes = 0;
      });
    } catch (e: any) {
      cleanup("setup failed: " + (e?.message ?? e));
    }
  })();
};
