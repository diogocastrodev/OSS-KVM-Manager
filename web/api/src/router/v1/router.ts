import db from "@/db/database";
import type { FastifyPluginAsync } from "fastify";
import authRoute from "./auth/auth.route";

const v1Router: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoute, {
    prefix: "/auth",
  });
  fastify.get("/user", async () => {
    return await db
      .selectFrom("users")
      .select("users.email")
      .select("users.name")
      .execute();
  });
  fastify.get(
    "/usera",
    { preValidation: [fastify.authRequired] },
    async (req) => {
      console.log("Authenticated user:", req.user);
      return await db
        .selectFrom("users")
        .select("users.email")
        .select("users.name")
        .execute();
    }
  );
};

export default v1Router;
