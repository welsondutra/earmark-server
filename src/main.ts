import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const origins = config.get('CORS_ORIGINS', { infer: true });
  if (origins.length > 0) app.enableCors({ origin: origins });

  await app.listen(config.get('PORT', { infer: true }), config.get('HOST', { infer: true }));
}
await bootstrap();
