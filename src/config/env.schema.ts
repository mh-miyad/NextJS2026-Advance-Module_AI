import * as dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  API_PREFIX: z.string(),
  API_VERSION: z.string(),
  DATABASE_URL: z.string().default(process.env.DATABASE_URL!),
  JWT_SECRET: z.string().min(10).default(process.env.JWT_SECRET!),
  JWT_REFRESH_SECRET: z.string().min(10).default(process.env.JWT_REFRESH_SECRET!),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Swagger
  SWAGGER_TITLE: z.string().default("Enterprise API"),
  SWAGGER_DESCRIPTION: z.string().default("API Documentation"),
  SWAGGER_VERSION: z.string().default("1.0"),
});
export type Env = z.infer<typeof envSchema>;
