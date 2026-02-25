import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ProblemDetailsFilter } from './core/exceptions/problem-detail.filter';
import { AppLogger } from './core/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ProblemDetailsFilter());

  await app.listen(process.env.PORT ?? 3000);
  logger.log('Application started on port 3000', 'Bootstrap');
}
bootstrap();
