import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { DatabaseModule } from "./shared/infrastructure/database/database.module";
import { BookingModule } from "./modules/booking/booking.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Event system (for inter-module communication)
    EventEmitterModule.forRoot(),

    // Shared Infrastructure
    DatabaseModule,

    // Business Capabilities
    BookingModule,
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
  ],
})
export class AppModule {}
