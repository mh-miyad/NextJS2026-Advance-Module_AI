import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  role: z.enum(["USER", "ADMIN", "MANAGER"]).default("USER"),
});

export class RegisterDto extends createZodDto(registerSchema) {
  @ApiProperty({ example: "user@example.com" })
  declare email: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  declare password: string;

  @ApiProperty({ example: "John Doe", minLength: 2, maxLength: 50 })
  declare name: string;

  @ApiProperty({
    example: "USER",
    enum: ["USER", "ADMIN", "MANAGER"],
    default: "USER",
    required: false,
  })
  declare role: "USER" | "ADMIN" | "MANAGER";
}

export type RegisterDtoType = z.infer<typeof registerSchema>;
