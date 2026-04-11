import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "./config/env.schema";

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService<Env>) {}
  getHello() {
    return {
      status: "ok",
      message: "Enterprise API is running",
      version: this.configService.get("API_VERSION", { infer: true }),
      timestamp: new Date().toISOString(),
    };
  }
}
