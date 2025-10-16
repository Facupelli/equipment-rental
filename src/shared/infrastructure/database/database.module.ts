import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClsModule } from "nestjs-cls";
import { TransactionContext } from "./transaction-context";
import { UnitOfWork } from "./unit-of-work.service";

@Global()
@Module({
	imports: [
		ClsModule.forRoot({
			global: true,
			middleware: { mount: false },
		}),
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
	providers: [TransactionContext, UnitOfWork],
	exports: [TransactionContext, UnitOfWork],
})
export class DatabaseModule {}
