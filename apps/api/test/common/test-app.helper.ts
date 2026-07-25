import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request, { SuperTest, Test as SuperTestTask } from 'supertest';

import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { API_PREFIX } from './constants';

export interface TestAppInstance {
  app: INestApplication;
  httpServer: any;
  request: SuperTest<SuperTestTask>;
}

export async function createTestApp(): Promise<TestAppInstance> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Atlas API')
    .setDescription('Atlas Infrastructure Intelligence Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();

  const httpServer = app.getHttpServer();
  const supertestRequest = request(httpServer);

  return {
    app,
    httpServer,
    request: supertestRequest,
  };
}

export async function closeTestApp(testApp: TestAppInstance): Promise<void> {
  if (testApp?.app) {
    await testApp.app.close();
  }
}
