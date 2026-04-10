import { Global, Module } from "@nestjs/common";
import { databaseProvider } from "./database.provider";

/**
 * @Global() — ekbar import korle sob jaygay available.
 * AppModule-e import korbo, tারপর aর কোথাও imports-e lagbena.
 */
@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule {}
