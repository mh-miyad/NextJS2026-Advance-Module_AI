import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6),
  role: z.enum(["USER", "ADMIN", "MANAGER"]).default("USER"),
  isActive: z.boolean().default(true),
});

export class CreateUserDto extends createZodDto(createUserSchema) {
  @ApiProperty({ example: "user@example.com" })
  declare email: string;

  @ApiProperty({ example: "John Doe" })
  declare name: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  declare password: string;

  @ApiProperty({
    enum: ["USER", "ADMIN", "MANAGER"],
    default: "USER",
    required: false,
  })
  declare role: "USER" | "ADMIN" | "MANAGER";

  @ApiProperty({ default: true, required: false })
  declare isActive: boolean;
}

export type CreateUserDtoType = z.infer<typeof createUserSchema>;
