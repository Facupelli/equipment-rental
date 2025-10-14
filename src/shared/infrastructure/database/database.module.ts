import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService, ConfigModule } from "@nestjs/config";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("postgres.host"),
        port: configService.get("postgres.port"),
        username: configService.get("postgres.username"),
        password: configService.get("postgres.password"),
        database: configService.get("postgres.database"),

        autoLoadEntities: true,
        synchronize: configService.get("NODE_ENV") !== "production",
        logging: configService.get("NODE_ENV") === "development",

        poolSize: 10,
      }),
    }),
  ],
})
export class DatabaseModule {}
