import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/users.schema";

export const DATABASE_TOKEN = "DATABASE";

// Export this type so repositories can use it with @Inject
export type DrizzleDB = NodePgDatabase<typeof schema>;

/**
 * Drizzle ORM provider.
 * `pg.Pool` use kori single connection-er bajaye —
 * production-e connection pooling mandatory, otherwise DB connection exhausted hoy.
 */
export const databaseProvider = {
  provide: DATABASE_TOKEN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleDB => {
    const pool = new Pool({
      connectionString: configService.getOrThrow<string>("DATABASE_URL"),
      // Pool config: production-e tune korba
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    return drizzle(pool, { schema });
  },
};
