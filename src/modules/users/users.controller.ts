import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @ApiOperation({ summary: "Create new user" })
  @ApiResponse({ status: 201, description: "User created" })
  @ApiResponse({
    status: 400,
    description: "Validation failed - Zod will show exact errors",
  })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", description: "User UUID" })
  async findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateUserDto, // Use UpdateUserDto in real app
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete user" })
  async remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }
}
