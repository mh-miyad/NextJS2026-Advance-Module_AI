import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * @UseGuards(JwtAuthGuard) — protected route-e ei guard use korbo.
 * Passport automatically Authorization header theke token extract kore,
 * verify kore, ar JwtStrategy.validate() call kore.
 * Validate-e return kora object req.user-e attached hoy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
