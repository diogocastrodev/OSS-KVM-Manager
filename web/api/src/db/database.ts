import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import env from "@/utils/env";
import type { DB } from "./__prisma_generated__/types";
import type { DatabaseSchemaType } from "./schema";

// Kysely Database Instance
const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: env.DATABASE_URL,
    }),
  }),
  log: env.NODE_ENV === "development" ? ["query", "error"] : [],
});

export default db;
