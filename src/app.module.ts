import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtGuard } from "./modules/auth/guards/jwt.guard";
import { BookingModule } from "./modules/booking/booking.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { UserModule } from "./modules/user/user.module";
import configuration, { envSchema } from "./shared/config/configuration";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";
import { DatabaseModule } from "./shared/infrastructure/database/database.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env",
			load: [configuration],
			validate: (env) => envSchema.parse(env),
		}),

		// Event system (for inter-module communication)
		EventEmitterModule.forRoot(),

		// Shared Infrastructure
		DatabaseModule,

		// Business Capabilities
		BookingModule,
		InventoryModule,
		CatalogModule,
		UserModule,
		PricingModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		// Global validation pipe - validates all incoming requests
		{
			provide: APP_PIPE,
			useClass: ZodValidationPipe,
		},
		// Global serialization interceptor - validates all outgoing responses
		{
			provide: APP_INTERCEPTOR,
			useClass: ZodSerializerInterceptor,
		},
		// Global exception filter - handles Zod errors gracefully
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
		{
			provide: APP_GUARD,
			useClass: JwtGuard,
		},
	],
})
export class AppModule {}
