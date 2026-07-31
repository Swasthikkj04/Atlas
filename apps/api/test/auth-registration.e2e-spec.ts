import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Auth Registration Endpoint Hardening Suite (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const testEmail = `reg-test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    const testFullName = 'Principal Reviewer';

    it('should successfully register a user and return a 201 response with sanitized user data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        })
        .expect(201);

      // Verify meaningful response contract
      expect(response.body).toHaveProperty(
        'message',
        'User registered successfully',
      );
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testEmail);
      expect(response.body.user).toHaveProperty('fullName', testFullName);
      expect(response.body.user).toHaveProperty('createdAt');

      // Verify sensitive fields and auth tokens are NOT exposed
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should return 409 Conflict when attempting to register with an already registered email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        })
        .expect(409);

      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body).toHaveProperty(
        'message',
        'Email is already registered.',
      );
    });

    it('should return 400 Bad Request when password is shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `short-pass-${Date.now()}@example.com`,
          password: 'short',
          fullName: 'Short Pass User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 Bad Request when email format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: testPassword,
          fullName: 'Invalid Email User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 Bad Request when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `missing-fields-${Date.now()}@example.com`,
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should NOT automatically log the user in or allow unauthenticated access to /me', async () => {
      // Direct call to /me without Authorization header should be rejected with 401
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

      // User must explicitly log in to receive tokens
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty('accessToken');
      expect(loginRes.body).toHaveProperty('refreshToken');

      // Profile can now be accessed with the obtained token
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(profileRes.body).toHaveProperty('email', testEmail);
    });
  });
});
