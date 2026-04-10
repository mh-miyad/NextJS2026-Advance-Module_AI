import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().email("Invalid Email Format"),
  password: z.string().min(8, "Password must be at least characters"),
});

export class LoginDto extends createZodDto(loginSchema) {
  @ApiProperty({
    example: "miyad@gmail.com",
    description: "User Valid Email Address",
  })
  declare email: string;
  @ApiProperty({
    example: "password123",
    description: "User password",
    minLength: 6,
  })
  declare password: string;
}
export type LoginDtoType = z.infer<typeof loginSchema>;
