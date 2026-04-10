import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<Env>);

  const port = configService.get("PORT", { infer: true })!;
  const apiPrefix = configService.get("API_PREFIX", { infer: true })!;
  const apiVersion = configService.get("API_VERSION", { infer: true })!;

  // Global prefix: /api/v1
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get("SWAGGER_TITLE", { infer: true })!)
    .setDescription(configService.get("SWAGGER_DESCRIPTION", { infer: true })!)
    .setVersion(configService.get("SWAGGER_VERSION", { infer: true })!)
    .addBearerAuth()
    // ❌ NO addServer() here
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });

  // ❌ DON'T ADD THIS: document.servers = [...]

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  await app.listen(port);

  console.log(
    `🚀 Server: http://localhost:${port}/${apiPrefix}/${apiVersion}/`,
  );
  console.log(`📚 Swagger: http://localhost:${port}/${apiPrefix}/docs`);
}

void bootstrap();
