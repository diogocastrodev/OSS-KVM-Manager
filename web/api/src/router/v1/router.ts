import db from "@/db/database";
import type { FastifyPluginAsync } from "fastify";
import authRoute from "./auth/auth.route";
import serversRoute from "./servers/servers.route";
import usersRoute from "./user/user.route";

const v1Router: FastifyPluginAsync = async (fastify) => {
  /* -------------------------------------------------------------------------- */
  /*                               CSRF Protection                              */
  /* -------------------------------------------------------------------------- */
  fastify.get("/csrf", async (req, reply) => {
    const token = reply.generateCsrf(); // sets secret cookie if missing
    return { token };
  });
  /* -------------------------------------------------------------------------- */
  /*                                 Auth Route                                 */
  /* -------------------------------------------------------------------------- */
  fastify.register(authRoute, {
    prefix: "/auth",
  });

  /* -------------------------------------------------------------------------- */
  /*                                Servers Route                               */
  /* -------------------------------------------------------------------------- */
  fastify.register(serversRoute, {
    prefix: "/servers",
  });
  /* -------------------------------------------------------------------------- */
  /*                                    Users                                   */
  /* -------------------------------------------------------------------------- */
  fastify.register(usersRoute, {
    prefix: "/user",
  });
  /* -------------------------------------------------------------------------- */
  /*                                    Tests                                   */
  /* -------------------------------------------------------------------------- */
  fastify.get("/userall", async () => {
    return await db
      .selectFrom("users")
      .select("users.email")
      .select("users.name")
      .execute();
  });
  fastify.get(
    "/usera",
    { preValidation: [fastify.authRequired] },
    async (req, reply) => {
      console.log("Authenticated user:", req.user);
      const a = await db
        .selectFrom("users")
        .select(["users.email", "users.name as userName"])
        .execute();

      const b = await db
        .selectFrom("refresh_tokens")
        .innerJoin("users", "users.id", "refresh_tokens.userId")
        .select([
          "users.createdAt as userCreatedAt",
          "refresh_tokens.createdAt as tokenCreatedAt",
        ])
        // .where("refresh_tokens.userId", "=", "a")
        .execute()
        .catch((err) => {
          console.error("Error fetching refresh tokens:", err);
          return [];
        });

      return reply.send({ a, b });
    }
  );
};

export default v1Router;
