# NestJS Project — সম্পূর্ণ বাংলা গাইড

> এই গাইডটি শুধুমাত্র এই project-এর জন্য লেখা।
> NestJS নতুন শিখছ — তাই প্রতিটা concept কেন আছে সেটাও বলা আছে।

---

## সূচিপত্র

1. [Project Structure — ফাইল কোথায় কী করে](#১-project-structure)
2. [NestJS-এর মূল ধারণা — Module, Provider, DI](#২-nestjs-এর-মূল-ধারণা)
3. [Database সংযোগ — Drizzle ORM](#৩-database-সংযোগ)
4. [Auth System — কীভাবে কাজ করে](#৪-auth-system)
5. [নতুন Feature যোগ করতে হলে — Step by Step](#৫-নতুন-feature-যোগ-করা)
6. [Environment Variables](#৬-environment-variables)
7. [API চালানো ও Test করা](#৭-api-চালানো-ও-test-করা)
8. [সাধারণ ভুল ও সমাধান](#৮-সাধারণ-ভুল-ও-সমাধান)

---

## ১. Project Structure

```
src/
├── main.ts                        ← App শুরু হয় এখান থেকে (port, swagger, prefix)
├── app.module.ts                  ← Root module — সব module এখানে import হয়
├── app.controller.ts              ← Health check route
│
├── config/
│   ├── config.module.ts           ← .env file load করে, validate করে
│   └── env.schema.ts              ← Zod দিয়ে .env এর shape define করা
│
├── database/
│   ├── database.module.ts         ← Global DB module (@Global)
│   ├── database.provider.ts       ← pg Pool + Drizzle instance তৈরি হয়
│   └── schema/
│       └── users.schema.ts        ← users table এর column definition
│
└── modules/
    ├── auth/
    │   ├── auth.module.ts         ← Auth এর সব কিছু একসাথে bind হয়
    │   ├── auth.controller.ts     ← /auth/register, /login, /refresh, /logout
    │   ├── auth.service.ts        ← Business logic: hashing, token, validation
    │   ├── dto/
    │   │   ├── login.dto.ts       ← Login এর input shape (Zod + Swagger)
    │   │   ├── register.dto.ts    ← Register এর input shape
    │   │   └── refresh-token.dto.ts ← Refresh endpoint এর input
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts  ← @UseGuards(JwtAuthGuard) — route protect করে
    │   ├── strategies/
    │   │   └── jwt.strategy.ts    ← Token verify করে, req.user set করে
    │   └── types/
    │       └── jwt-payload.type.ts ← Token এর ভেতরে কী থাকে তার type
    │
    └── users/
        ├── users.module.ts        ← Users এর সব কিছু bind হয়
        ├── users.controller.ts    ← /users CRUD routes
        ├── users.service.ts       ← Business logic: create, find, update, delete
        ├── users.repository.ts    ← শুধু DB query — Drizzle code এখানেই
        └── dto/
            └── create-user.dto.ts ← User তৈরির input shape
```

---

## ২. NestJS-এর মূল ধারণা

### Module কী?

Module হলো একটা **বাক্স** যেখানে সম্পর্কিত জিনিস একসাথে থাকে।
`users.module.ts` মানে Users সংক্রান্ত সব কিছু — Controller, Service, Repository — এই বাক্সে।

```typescript
@Module({
  controllers: [UsersController],   // Routes handle করে
  providers: [UsersService, UsersRepository], // Business logic + DB query
  exports: [UsersService, UsersRepository],   // অন্য module ব্যবহার করতে পারবে
})
export class UsersModule {}
```

**exports কেন লাগে?**
`AuthModule` এ `UsersRepository` দরকার (JWT validate করতে)।
`UsersModule` এ `exports` না থাকলে `AuthModule` নিতে পারত না।

---

### Provider কী?

`@Injectable()` দেওয়া যেকোনো class = Provider।
NestJS নিজেই এটা তৈরি করে এবং যেখানে লাগে সেখানে **inject** করে।

```typescript
// NestJS নিজে থেকে এটা করে:
const usersRepo = new UsersRepository(db); // db inject করে
const usersService = new UsersService(usersRepo); // usersRepo inject করে
const controller = new UsersController(usersService); // usersService inject করে
```

তুমি `new UsersService()` কখনো নিজে করবে না। NestJS করবে।

---

### Dependency Injection (DI) কীভাবে কাজ করে

```typescript
@Injectable()
export class UsersService {
  // Constructor-এ যা চাইবে, NestJS দিয়ে দেবে
  constructor(private readonly usersRepo: UsersRepository) {}
}
```

NestJS দেখে: "UsersService এর `UsersRepository` লাগবে।"
তারপর সে `UsersModule` এর providers তালিকায় খোঁজে।
পায়, তৈরি করে, inject করে। তুমি কিছু করতে হবে না।

---

### @Global() Module কী?

```typescript
@Global()
@Module({ providers: [databaseProvider], exports: [databaseProvider] })
export class DatabaseModule {}
```

`@Global()` মানে — এই module একবার `AppModule` এ import করলে,
বাকি সব module এ **আর import করতে হবে না**, সরাসরি inject করা যাবে।

`DatabaseModule` ও `ConfigModule` দুটোই Global — তাই `UsersModule`
বা `AuthModule` এ এদের import করতে হয় না।

---

## ৩. Database সংযোগ

### কীভাবে connect হয়?

```
.env (DATABASE_URL)
    ↓
database.provider.ts (pg.Pool তৈরি করে, drizzle() wrap করে)
    ↓
database.module.ts (@Global — সব জায়গায় পাওয়া যাবে)
    ↓
users.repository.ts (@Inject(DATABASE_TOKEN) — এখানে DB instance পায়)
```

### Schema কোথায় থাকে?

`src/database/schema/users.schema.ts` — এখানে **table structure** define করা।

```typescript
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  // ... বাকি columns
});

// TypeScript type — DB থেকে আসা data এই type হবে
export type User = typeof users.$inferSelect;
// Insert করার সময় এই type লাগবে
export type NewUser = typeof users.$inferInsert;
```

### Query লেখার নিয়ম (Repository তে)

```typescript
// ✅ সব query repository তে লেখো — service এ কখনো না
// users.repository.ts

// Email দিয়ে খোঁজা
async findByEmail(email: string) {
  const [user] = await this.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return user ?? null; // না পেলে null
}

// নতুন user তৈরি
async create(data: CreateInput) {
  const [user] = await this.db
    .insert(schema.users)
    .values(data)
    .returning(); // insert করে সাথে সাথে data ফেরত দেয়
  return user;
}
```

---

## ৪. Auth System

### কীভাবে কাজ করে — পুরো flow

#### Register (`POST /api/v1/auth/register`)

```
Client → { email, password, name }
    ↓
AuthController.register()
    ↓
AuthService.register()
    1. Email আগে আছে কিনা check
    2. bcrypt দিয়ে password hash (cost 12)
    3. DB তে user save
    4. accessToken (15min) + refreshToken (7d) তৈরি
    5. refreshToken hash করে DB তে save
    ↓
Response → { user: {...}, accessToken: "...", refreshToken: "..." }
```

#### Login (`POST /api/v1/auth/login`)

```
Client → { email, password }
    ↓
AuthService.login()
    1. Email দিয়ে user খোঁজো
    2. bcrypt.compare() দিয়ে password check
    3. Tokens generate + refresh token DB তে save
    ↓
Response → { user: {...}, accessToken: "...", refreshToken: "..." }
```

#### Protected Route-এ Request

```
Client → Authorization: Bearer <accessToken>
    ↓
JwtAuthGuard (চালু হয় @UseGuards এর কারণে)
    ↓
JwtStrategy.validate()
    1. Token verify (signature + expiry)
    2. payload.sub থেকে userId নাও
    3. DB থেকে user fetch করো
    4. user = req.user
    ↓
Controller এ req.user পাও
```

#### Refresh Token (`POST /api/v1/auth/refresh`)

```
Client → { refreshToken: "..." }
    ↓
AuthService.refreshTokens()
    1. Token decode করো (expiry ignore)
    2. DB তে stored hash এর সাথে match করো
    3. JWT signature + expiry verify (REFRESH_SECRET দিয়ে)
    4. নতুন দুটো token তৈরি করো (rotation)
    ↓
Response → { accessToken: "...", refreshToken: "..." }
```

#### Logout (`POST /api/v1/auth/logout`) ← Protected

```
Client → Authorization: Bearer <accessToken>
    ↓
AuthService.logout(userId)
    1. DB তে refreshToken = null
    ↓
Response → { message: "Logged out successfully" }
```

---

### JWT Token-এর ভেতরে কী থাকে?

```typescript
// src/modules/auth/types/jwt-payload.type.ts
type JwtPayload = {
  sub: string;    // user-এর id (JWT standard — "subject")
  email: string;
  role: "USER" | "ADMIN" | "MANAGER";
}
```

---

### Route কীভাবে Protect করো?

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

// শুধু একটা route protect
@Get("profile")
@UseGuards(JwtAuthGuard)
getProfile(@Request() req) {
  return req.user; // JWT থেকে আসা user data
}

// পুরো controller protect
@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {
  // সব route এখন protected
}
```

---

## ৫. নতুন Feature যোগ করা

ধরো তুমি **Products** নামে নতুন feature যোগ করবে।
**প্রতিটা ধাপ অনুসরণ করো:**

---

### ধাপ ১ — Database Schema তৈরি করো

`src/database/schema/products.schema.ts` ফাইল তৈরি করো:

```typescript
import { pgTable, uuid, varchar, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema"; // foreign key এর জন্য

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

---

### ধাপ ২ — DTO তৈরি করো

`src/modules/products/dto/create-product.dto.ts`:

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  price: z.number().positive("Price must be positive"),
  isActive: z.boolean().default(true),
});

export class CreateProductDto extends createZodDto(createProductSchema) {
  @ApiProperty({ example: "iPhone 15" })
  declare name: string;

  @ApiProperty({ example: 999.99 })
  declare price: number;

  @ApiProperty({ default: true, required: false })
  declare isActive: boolean;
}
```

---

### ধাপ ৩ — Repository তৈরি করো

`src/modules/products/products.repository.ts`:

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_TOKEN } from "../../database/database.provider";
import * as schema from "../../database/schema/products.schema";
import { NewProduct } from "../../database/schema/products.schema";

type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class ProductsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DB) {}

  async findAll() {
    return this.db.select().from(schema.products);
  }

  async findById(id: string) {
    const [product] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    return product ?? null;
  }

  async create(data: Omit<NewProduct, "id" | "createdAt" | "updatedAt">) {
    const [product] = await this.db
      .insert(schema.products)
      .values(data)
      .returning();
    return product;
  }

  async update(id: string, data: Partial<NewProduct>) {
    const [product] = await this.db
      .update(schema.products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();
    return product ?? null;
  }

  async delete(id: string) {
    await this.db.delete(schema.products).where(eq(schema.products.id, id));
  }
}
```

---

### ধাপ ৪ — Service তৈরি করো

`src/modules/products/products.service.ts`:

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { ProductsRepository } from "./products.repository";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async findAll() {
    return this.productsRepo.findAll();
  }

  async findOne(id: string) {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.productsRepo.create(dto);
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException("Product not found");
    return this.productsRepo.update(id, dto);
  }

  async remove(id: string) {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException("Product not found");
    await this.productsRepo.delete(id);
    return { message: "Product deleted" };
  }
}
```

---

### ধাপ ৫ — Controller তৈরি করো

`src/modules/products/products.controller.ts`:

```typescript
import {
  Body, Controller, Delete, Get,
  Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)   // ← পুরো controller protected
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: "Create product" })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all products" })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update product" })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete product" })
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }
}
```

---

### ধাপ ৬ — Module তৈরি করো

`src/modules/products/products.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module"; // JwtAuthGuard এর জন্য
import { ProductsController } from "./products.controller";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

@Module({
  imports: [AuthModule],  // JwtAuthGuard এখান থেকে আসে
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
```

---

### ধাপ ৭ — AppModule এ যোগ করো

`src/app.module.ts` তে শুধু import এবং `imports` array তে add করো:

```typescript
import { ProductsModule } from "./modules/products/products.module";

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule, AuthModule, ProductsModule],
  // ...
})
export class AppModule {}
```

**ব্যস! নতুন feature তৈরি।**

---

## ৬. Environment Variables

`.env` ফাইলে এই variables থাকা লাগবে:

| Variable | কাজ | Example |
|---|---|---|
| `PORT` | Server কোন port এ চলবে | `8000` |
| `NODE_ENV` | Environment | `development` |
| `API_PREFIX` | URL prefix | `api` |
| `API_VERSION` | URL version | `v1` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Access token sign করার secret | যেকোনো লম্বা random string |
| `JWT_REFRESH_SECRET` | Refresh token sign করার secret | আলাদা random string |
| `JWT_EXPIRES_IN` | (unused — code এ hardcoded 15m/7d) | `7d` |
| `SWAGGER_TITLE` | Swagger UI তে title | `My API` |
| `SWAGGER_DESCRIPTION` | Swagger UI তে description | `API docs` |
| `SWAGGER_VERSION` | Swagger UI তে version | `1.0.0` |

**নতুন variable যোগ করতে হলে:**

১. `.env` এ যোগ করো
২. `src/config/env.schema.ts` এ Zod schema তে যোগ করো:
```typescript
MY_NEW_VAR: z.string().default("some-default"),
```
৩. যেখানে লাগবে সেখানে inject করো:
```typescript
constructor(private readonly configService: ConfigService) {}

// ব্যবহার:
const value = this.configService.getOrThrow<string>("MY_NEW_VAR");
```

---

## ৭. API চালানো ও Test করা

### Server চালানো

```bash
# Development (hot reload সহ)
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

### Swagger UI

Server চললে browser এ যাও:
```
http://localhost:8000/api/docs
```

এখান থেকে সব API graphically test করতে পারবে।

**Authorize করতে:**
1. `POST /api/v1/auth/login` call করো
2. Response থেকে `accessToken` copy করো
3. Swagger-এ উপরে "Authorize" বাটনে click করো
4. `Bearer <accessToken>` দাও

### API Routes Summary

| Method | Route | Protected | কাজ |
|---|---|---|---|
| POST | `/api/v1/auth/register` | না | নতুন account |
| POST | `/api/v1/auth/login` | না | Login |
| POST | `/api/v1/auth/refresh` | না | নতুন tokens |
| POST | `/api/v1/auth/logout` | হ্যাঁ | Logout |
| POST | `/api/v1/users` | না | User তৈরি |
| GET | `/api/v1/users` | না | সব user |
| GET | `/api/v1/users/:id` | না | একটা user |
| PATCH | `/api/v1/users/:id` | না | Update |
| DELETE | `/api/v1/users/:id` | না | Delete |

---

## ৮. সাধারণ ভুল ও সমাধান

### ❌ "Cannot find module" error

কারণ: Module এ import বা providers array তে যোগ করা হয়নি।

সমাধান:
- Service/Repository `providers` array তে আছে কিনা check করো
- অন্য module থেকে নিলে সেটা `imports` এ আছে কিনা এবং সেই module `exports` করছে কিনা দেখো

---

### ❌ "Circular dependency" error

কারণ: Module A, Module B import করে। Module B আবার Module A import করে।

সমাধান: `forwardRef()` ব্যবহার করো অথবা architecture পুনর্বিবেচনা করো।

---

### ❌ Route কাজ করছে না / 404

কারণ: Controller টা কোনো Module এ নেই বা Module `AppModule` এ নেই।

সমাধান:
1. Controller → Module এর `controllers` array তে আছে কিনা
2. Module → `AppModule` এর `imports` array তে আছে কিনা

---

### ❌ JWT "Unauthorized" আসছে valid token দিলেও

কারণ: `JWT_SECRET` mismatch, অথবা token expire, অথবা JwtStrategy providers এ নেই।

সমাধান:
1. `.env` এর `JWT_SECRET` ঠিক আছে কিনা দেখো
2. `AuthModule` এর `providers` এ `JwtStrategy` আছে কিনা দেখো
3. যে module এ guard ব্যবহার করছ সে module `AuthModule` import করছে কিনা দেখো

---

### ❌ DB connection error

কারণ: `.env` এর `DATABASE_URL` ভুল।

সমাধান: Format হওয়া উচিত:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

Supabase pooler ব্যবহার করলে port `6543` (transaction mode)।

---

### ❌ Validation error / 400 Bad Request

কারণ: Request body তে Zod schema অনুযায়ী data পাঠাওনি।

সমাধান: Swagger UI তে গিয়ে schema দেখো, সব required field পাঠাচ্ছ কিনা নিশ্চিত করো।

---

## দ্রুত Reference

### নতুন Module তৈরির Checklist

```
✅ src/database/schema/xxx.schema.ts     — Table define
✅ src/modules/xxx/dto/create-xxx.dto.ts  — Input validation
✅ src/modules/xxx/xxx.repository.ts      — DB queries
✅ src/modules/xxx/xxx.service.ts         — Business logic
✅ src/modules/xxx/xxx.controller.ts      — Routes
✅ src/modules/xxx/xxx.module.ts          — Module bind
✅ src/app.module.ts imports এ যোগ করো   — Register
```

### File তৈরির Pattern (Copy করে ব্যবহার করো)

প্রতিটা নতুন feature এ উপরের ধাপগুলো follow করলে কখনো হারিয়ে যাবে না।
`users` module টা সবচেয়ে ভালো example — সেটা দেখে বুঝতে পারবে।
