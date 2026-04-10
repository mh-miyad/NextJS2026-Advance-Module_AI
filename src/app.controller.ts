import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Env } from "./config/env.schema";

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService<Env>,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "API Health Check" })
  getHello() {
    return {
      status: "ok",
      message: "Enterprise API is running",
      version: this.configService.get("API_VERSION", { infer: true }),
      timestamp: new Date().toISOString(),
    };
  }
}
