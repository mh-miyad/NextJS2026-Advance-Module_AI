import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersRepository } from "../../users/users.repository";
import { JwtPayload } from "../types/jwt-payload.type";

/**
 * JWT Strategy — Passport-er middleware.
 *
 * Kono protected route-e request ashle Passport:
 *  1. Authorization: Bearer <token> header theke token extract kore
 *  2. JWT_SECRET diye verify kore
 *  3. Decoded payload niye validate() call kore
 *  4. validate()-er return value = req.user
 *
 * Keno DB hit kori validate()-e?
 *  Token valid thakলেও user delete/deactivate hoye thakতে পারে।
 *  Token revoke kora possible na (stateless), kintu isActive check kore
 *  disabled account block kora jay.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersRepo: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account not found or disabled");
    }
    // password & refreshToken strip kori — req.user-e sensitive data rakhbo na
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
