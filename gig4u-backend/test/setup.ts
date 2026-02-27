import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters';
import { ResponseInterceptor, LoggingInterceptor } from '../src/common/interceptors';

let app: INestApplication;
let prisma: PrismaService;

/**
 * Bootstraps the NestJS test application once, reusable across all e2e test files.
 * Call in beforeAll — idempotent if already initialized.
 */
export async function setupTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  if (app) return { app, prisma };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());
  app.setGlobalPrefix('api');

  await app.init();

  prisma = app.get(PrismaService);

  return { app, prisma };
}

/**
 * Tears down the test application. Call in afterAll.
 */
export async function teardownTestApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}

export { app, prisma };
