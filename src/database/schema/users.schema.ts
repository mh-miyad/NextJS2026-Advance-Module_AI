import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// DB-level enum — PostgreSQL e actual ENUM type create hobe
export const roleEnum = pgEnum("role", ["USER", "ADMIN", "MANAGER"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // Password never stored as plain text — always bcrypt hash
  password: varchar("password", { length: 255 }).notNull(),
  role: roleEnum("role").default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Hashed refresh token — null means logged out
  refreshToken: varchar("refresh_token", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
