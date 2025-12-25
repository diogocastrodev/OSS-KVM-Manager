import "@fastify/jwt";
import type { JwtPayload } from "@/plugins/auth";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
