import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    // PassportModule — Passport middleware NestJS-e integrate kore
    PassportModule.register({ defaultStrategy: "jwt" }),

    // JwtModule — JwtService inject korte lagbe (signAsync, verifyAsync, decode)
    // Secret ekhaney dewa lagbena — signAsync-e per-call dewa hobe
    JwtModule.register({}),

    // UsersModule import — JwtStrategy-er UsersRepository dorkar
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,   // Passport strategy as provider
    JwtAuthGuard,  // Guard as provider — other module-e inject korte parbe
  ],
  exports: [JwtAuthGuard, JwtStrategy], // Other module protect korte parbe
})
export class AuthModule {}
