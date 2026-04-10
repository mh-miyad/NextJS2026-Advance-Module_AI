import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // nestjs-zod এর ZodValidationPipe — Zod schema দিয়ে validate করে
      // ZSerializerInterceptor (nest-zod) remove করলাম — ওটার internal
      // ZodType dependency AppModule এ register করা ছিল না, তাই crash করত
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
