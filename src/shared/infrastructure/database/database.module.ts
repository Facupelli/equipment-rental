import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST", "localhost"),
        port: configService.get("DB_PORT", 5432),
        username: configService.get("DB_USERNAME", "postgres"),
        password: configService.get("DB_PASSWORD", "postgres"),
        database: configService.get("DB_NAME", "equipment_rental"),

        autoLoadEntities: true,
        synchronize: configService.get("NODE_ENV") !== "production",
        logging: configService.get("NODE_ENV") === "development",

        poolSize: 10,
      }),
    }),
  ],
})
export class DatabaseModule {}
