import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { envSchema } from "./env.schema";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // 🔥 Global - no need to import in other modules
      validate: (config) => {
        const parsed = envSchema.safeParse(config);

        if (!parsed.success) {
          console.error(
            "❌ Environment validation failed:",
            parsed.error.format(),
          );
          throw new Error("Invalid environment variables");
        }

        console.log("✅ Environment variables loaded successfully");
        return parsed.data;
      },
      cache: true,
    }),
  ],
})
export class ConfigModule {}
