import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit NestJS app-er baaire chale (standalone CLI tool)
// tai ConfigService theke env newa jay na — dotenv directly load korte hoy
dotenv.config();

export default defineConfig({
  // Schema file(s) — ekhane sob table define kora ache
  // Glob pattern use kora jay: "src/database/schema/*.schema.ts"
  schema: "./src/database/schema/*.schema.ts",

  // Migration files kothay save hobe
  out: "./src/database/migrations",

  // PostgreSQL use kortesi
  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Migration file-e table/column-er full name include korbe
  // debugging-e help kore
  verbose: true,

  // Migration apply korার age confirm nebe
  strict: true,
});
