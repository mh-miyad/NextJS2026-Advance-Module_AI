import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  DATABASE_TOKEN,
  type DrizzleDB,
} from "../../database/database.provider";
import * as schema from "../../database/schema/users.schema";
import { NewUser } from "../../database/schema/users.schema";

type CreateInput = Omit<NewUser, "id" | "createdAt" | "updatedAt">;
type UpdateInput = Partial<Omit<NewUser, "id" | "createdAt">>;

/**
 * Repository pattern — sob DB query ekjaygay thakbe.
 *
 * Keno? Service-e drizzle code likhle:
 *  1. Test kora kothin (mock korte hoy pura DB)
 *  2. Same query multiple service-e duplicate hoy
 *  3. Schema change hole sob jaygay fix korte hoy
 *
 * Repository-te rakhlে shudhu ekta jaygay fix.
 */
@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DrizzleDB) {}

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user ?? null;
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user ?? null;
  }

  async findAll() {
    return this.db.select().from(schema.users);
  }

  async create(data: CreateInput) {
    const [user] = await this.db.insert(schema.users).values(data).returning();
    return user;
  }

  async update(id: string, data: UpdateInput) {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user ?? null;
  }

  async delete(id: string) {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  /**
   * Refresh token store/clear.
   * null dile = logout (DB-te null save hoy)
   */
  async saveRefreshToken(id: string, hashedToken: string | null) {
    await this.db
      .update(schema.users)
      .set({ refreshToken: hashedToken, updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }
}
