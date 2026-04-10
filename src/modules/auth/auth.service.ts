import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User } from "../../database/schema/users.schema";
import { UsersRepository } from "../users/users.repository";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./types/jwt-payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Duplicate email check
    const exists = await this.usersRepo.findByEmail(dto.email);
    if (exists) throw new ConflictException("Email already in use");

    // bcrypt cost factor 12 — brute force ke expensive kore tole.
    // 10 = default, 12 = ~300ms, 14 = ~1s. 12 production-er jonno ideal.
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersRepo.create({ ...dto, password: hashedPassword });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findByEmail(dto.email);

    // "Invalid credentials" — same message "email not found" ar "wrong password" duita-tei.
    // Keno? Alag message dile attacker bujhe fele email ta exist kore (user enumeration attack).
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (!user.isActive) throw new ForbiddenException("Account is disabled");

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException("Invalid credentials");

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitize(user), ...tokens };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    // Step 1: Token decode kori (expiry check na kore) — userId dorkar
    let payload: JwtPayload;
    try {
      payload = this.jwtService.decode<JwtPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    if (!payload?.sub) throw new UnauthorizedException("Invalid token");

    // Step 2: DB theke user ber kori
    const user = await this.usersRepo.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException("Access denied — please login again");
    }

    // Step 3: DB-te stored hash-er sathe match kori
    // Keno? Token rotate kori — old refresh token reuse holeo kaje ashbena
    const tokenMatch = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!tokenMatch) throw new UnauthorizedException("Invalid refresh token");

    // Step 4: Actual JWT signature + expiry verify kori REFRESH_SECRET diye
    try {
      await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      // Token expired ba tampered — clear kore do (token rotation security)
      await this.usersRepo.saveRefreshToken(user.id, null);
      throw new UnauthorizedException("Refresh token expired — please login again");
    }

    // Step 5: Nতুন tokens generate kori (rotation)
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    // DB-te refreshToken null kore do — next refresh attempt fail korbe
    await this.usersRepo.saveRefreshToken(userId, null);
    return { message: "Logged out successfully" };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Access token: 15 min — short-lived, stateless
   * Refresh token: 7 days — long-lived, DB-te hashed store thake
   *
   * Keno alag secrets?
   * Ek secret hole refresh token diye access token forge kora possible.
   * Alag secret = alag signing key = attack surface kom.
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: "USER" | "ADMIN" | "MANAGER",
  ) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh token plain text DB-te rakhbo na — hash kori.
   * Keno? DB leak hole attacker sob user-er session hijack korte parbe.
   * Hash thakle token-ta janar kono upay nai.
   * (bcrypt cost 10 — refresh token-er jonno 12 darkar nei, 10 ok)
   */
  private async persistRefreshToken(userId: string, rawToken: string) {
    const hashed = await bcrypt.hash(rawToken, 10);
    await this.usersRepo.saveRefreshToken(userId, hashed);
  }

  /** password + refreshToken response-e kabhi pathabo na */
  private sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = user;
    return safe;
  }
}
