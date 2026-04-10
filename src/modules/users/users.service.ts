import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { User } from "../../database/schema/users.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepo.findByEmail(dto.email);
    if (exists) throw new ConflictException("Email already in use");

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepo.create({ ...dto, password: hashedPassword });
    return this.sanitize(user);
  }

  async findAll() {
    const users = await this.usersRepo.findAll();
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User not found`);
    return this.sanitize(user);
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User not found`);

    const data: Partial<CreateUserDto & { password: string }> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.usersRepo.update(id, data);
    return this.sanitize(updated!);
  }

  async remove(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User not found`);
    await this.usersRepo.delete(id);
    return { message: "User deleted successfully" };
  }

  private sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = user;
    return safe;
  }
}
