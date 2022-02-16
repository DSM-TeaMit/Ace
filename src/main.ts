import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './shared/interceptors/logger.interceptor';
import 'dotenv/config';
import { SentryInterceptor } from './shared/interceptors/sentry.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);

    Sentry.init({
      release: `${process.env.SENTRY_PROJECT_NAME}@${process.env.npm_package_version}`,
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      integrations: [new Sentry.Integrations.Http({ tracing: true })],
    });
    app.useGlobalInterceptors(new SentryInterceptor());
  }

  app.useGlobalInterceptors(new LoggerInterceptor());

  await app.listen(3000);
}
bootstrap();
