/**
 * JWT token-er payload structure.
 * Access token & refresh token duita-tei same payload use kori.
 * `sub` = user id (JWT standard claim)
 */
export type JwtPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN" | "MANAGER";
};
