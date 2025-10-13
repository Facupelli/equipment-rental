import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [],
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
