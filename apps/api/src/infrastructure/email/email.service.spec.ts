import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import {
  EMAIL_PROVIDER,
  EmailProvider,
  SendEmailPayload,
} from './providers/email-provider.interface';

describe('PROD-AUTH-001 / AUTH-016: EmailService Environment-Driven URL & Provider Abstraction', () => {
  let service: EmailService;
  let mockProvider: jest.Mocked<EmailProvider>;
  let mockConfigService: { get: jest.Mock };

  const createTestModule = async (
    envOverrides: Record<string, string | null> = {},
  ) => {
    mockProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const configMap: Record<string, string | null> = {
      EMAIL_FROM: 'no-reply@argonion.com',
      APP_NAME: 'Nebula',
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:5173',
      FRONTEND_URL: 'http://localhost:5173',
      ...envOverrides,
    };

    mockConfigService = {
      get: jest.fn((key: string) => configMap[key] ?? null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: EMAIL_PROVIDER,
          useValue: mockProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  };

  beforeEach(async () => {
    await createTestModule();
  });

  describe('sendVerificationEmail', () => {
    it('constructs correct email payload with development /verify-email URL when running locally', async () => {
      const rawToken =
        'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
      await service.sendVerificationEmail(
        'swasthik@example.com',
        rawToken,
        'Swasthik',
      );

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      expect(payload.to).toBe('swasthik@example.com');
      expect(payload.from).toBe('Nebula <no-reply@argonion.com>');
      expect(payload.subject).toBe('Verify your Nebula workspace');

      const expectedUrl = `http://localhost:5173/verify-email?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.html).toContain('Verify your email address');
      expect(payload.html).toContain('Swasthik');
      expect(payload.html).toContain('24 hours');

      expect(payload.text).toContain(expectedUrl);
      expect(payload.text).toContain('Swasthik');
      expect(payload.text).toContain('24 hours');
    });

    it('constructs production verification URL using FRONTEND_URL and contains zero localhost references', async () => {
      await createTestModule({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://nebula.argonion.com',
        APP_URL: 'https://nebula.argonion.com',
      });

      const rawToken = 'prod-opaque-token-hex-9876543210abcdef';
      await service.sendVerificationEmail(
        'user@argonion.com',
        rawToken,
        'Owner',
      );

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      const expectedUrl = `https://nebula.argonion.com/verify-email?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.text).toContain(expectedUrl);

      // Strict Production Guarantee: Zero localhost / 127.0.0.1 references
      expect(payload.html).not.toContain('localhost');
      expect(payload.html).not.toContain('127.0.0.1');
      expect(payload.text).not.toContain('localhost');
      expect(payload.text).not.toContain('127.0.0.1');
    });

    it('falls back safely to https://nebula.argonion.com in production mode if FRONTEND_URL/APP_URL are empty', async () => {
      await createTestModule({
        NODE_ENV: 'production',
        FRONTEND_URL: null,
        APP_URL: null,
      });

      const rawToken = 'prod-fallback-token-12345';
      await service.sendVerificationEmail('user@argonion.com', rawToken);

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      const expectedUrl = `https://nebula.argonion.com/verify-email?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.text).toContain(expectedUrl);
      expect(payload.html).not.toContain('localhost');
      expect(payload.text).not.toContain('localhost');
    });

    it('normalizes and trims trailing slashes from configured FRONTEND_URL', async () => {
      await createTestModule({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://nebula.argonion.com///',
        APP_URL: 'https://nebula.argonion.com/',
      });

      const rawToken = 'prod-trailing-slash-token';
      await service.sendVerificationEmail('user@argonion.com', rawToken);

      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];
      const expectedUrl = `https://nebula.argonion.com/verify-email?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.html).not.toContain(
        'https://nebula.argonion.com///verify-email',
      );
      expect(payload.html).not.toContain(
        'https://nebula.argonion.com//verify-email',
      );
    });

    it('preserves raw verification token exactly without mutation or loss of entropy', async () => {
      const complexToken =
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855-SEC_TEST_v1';
      await service.sendVerificationEmail('swasthik@example.com', complexToken);

      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];
      expect(payload.html).toContain(`token=${complexToken}`);
      expect(payload.text).toContain(`token=${complexToken}`);
    });

    it('safely handles provider errors without crashing caller', async () => {
      mockProvider.send.mockRejectedValueOnce(
        new Error('SMTP Connection Refused'),
      );

      await expect(
        service.sendVerificationEmail('swasthik@example.com', 'raw-token'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('constructs correct password reset payload with development URL', async () => {
      const rawResetToken = 'reset-token-abc-123';
      await service.sendPasswordResetEmail(
        'swasthik@example.com',
        rawResetToken,
        'Swasthik',
      );

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      expect(payload.to).toBe('swasthik@example.com');
      expect(payload.from).toBe('Nebula <no-reply@argonion.com>');
      expect(payload.subject).toBe('Reset your Nebula password');

      const expectedResetUrl = `http://localhost:5173/reset-password?token=${rawResetToken}`;
      expect(payload.html).toContain(expectedResetUrl);
      expect(payload.html).toContain('1 hour');
      expect(payload.text).toContain(expectedResetUrl);
    });

    it('constructs production password reset URL without localhost references', async () => {
      await createTestModule({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://nebula.argonion.com',
      });

      const rawResetToken = 'prod-reset-token-999';
      await service.sendPasswordResetEmail('user@argonion.com', rawResetToken);

      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];
      const expectedResetUrl = `https://nebula.argonion.com/reset-password?token=${rawResetToken}`;
      expect(payload.html).toContain(expectedResetUrl);
      expect(payload.text).toContain(expectedResetUrl);
      expect(payload.html).not.toContain('localhost');
      expect(payload.text).not.toContain('localhost');
    });
  });

  describe('sendPasswordResetConfirmationEmail', () => {
    it('constructs security notice email and sends via provider', async () => {
      await service.sendPasswordResetConfirmationEmail(
        'swasthik@example.com',
        'Swasthik',
      );

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      expect(payload.to).toBe('swasthik@example.com');
      expect(payload.from).toBe('Nebula <no-reply@argonion.com>');
      expect(payload.subject).toBe('Your Nebula password was changed');
      expect(payload.html).toContain('Password successfully updated');
      expect(payload.text).toContain(
        'The password for your Nebula account was successfully changed',
      );
    });
  });

  describe('sendAccountReactivationEmail', () => {
    it('constructs development account reactivation URL', async () => {
      const rawToken = 'reactivate-token-123';
      await service.sendAccountReactivationEmail(
        'swasthik@example.com',
        rawToken,
        'Swasthik',
      );

      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      expect(payload.to).toBe('swasthik@example.com');
      expect(payload.subject).toBe('Reactivate your Nebula account');
      const expectedUrl = `http://localhost:5173/reactivate?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.text).toContain(expectedUrl);
    });

    it('constructs production account reactivation URL without localhost references', async () => {
      await createTestModule({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://nebula.argonion.com',
      });

      const rawToken = 'prod-reactivate-token-456';
      await service.sendAccountReactivationEmail('user@argonion.com', rawToken);

      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];
      const expectedUrl = `https://nebula.argonion.com/reactivate?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.text).toContain(expectedUrl);
      expect(payload.html).not.toContain('localhost');
      expect(payload.text).not.toContain('localhost');
    });
  });

  describe('sendWelcomeEmail (AUTH-EMAIL-001)', () => {
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        emailDeliveryRecord: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
    });

    it('dispatches personal welcome email with Swasthik sender and support reply-to', async () => {
      const result = await service.sendWelcomeEmail(
        'usr-123',
        'swasthik@example.com',
        'Swasthik K J',
      );

      expect(result.status).toBe('SENT');
      expect(mockProvider.send).toHaveBeenCalledTimes(1);
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];

      expect(payload.to).toBe('swasthik@example.com');
      expect(payload.from).toBe('Swasthik K J <swasthik@argonion.com>');
      expect(payload.replyTo).toBe('support@argonion.com');
      expect(payload.subject).toBe('A little welcome to Nebula');
      expect(payload.html).toContain('Hi Swasthik,');
      expect(payload.html).toContain('Enter Nebula &rarr;');
      expect(payload.html).toContain('swasthik@argonion.com');
      expect(payload.text).toContain('Hi Swasthik,');
      expect(payload.text).toContain('Swasthik K J\nDeveloper, Nebula');
    });

    it('respects environment overrides for sender, reply-to, and app URL', async () => {
      await createTestModule({
        EMAIL_FROM_NAME: 'Custom Founder',
        EMAIL_FROM_ADDRESS: 'founder@argonion.com',
        EMAIL_REPLY_TO: 'help@argonion.com',
        NEBULA_APP_URL: 'https://nebula.argonion.com',
      });

      const result = await service.sendWelcomeEmail(
        'usr-456',
        'user@argonion.com',
        'Alice Smith',
      );

      expect(result.status).toBe('SENT');
      const payload: SendEmailPayload = mockProvider.send.mock.calls[0][0];
      expect(payload.from).toBe('Custom Founder <founder@argonion.com>');
      expect(payload.replyTo).toBe('help@argonion.com');
      expect(payload.html).toContain('Hi Alice,');
      expect(payload.html).toContain('https://nebula.argonion.com');
    });

    it('enforces idempotency: does not resend if already marked SENT in database', async () => {
      mockPrisma.emailDeliveryRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        status: 'SENT',
        sentAt: new Date(),
      });

      (service as any).prisma = mockPrisma;

      const result = await service.sendWelcomeEmail(
        'usr-123',
        'user@example.com',
        'Swasthik',
      );

      expect(result.status).toBe('ALREADY_SENT');
      expect(mockProvider.send).not.toHaveBeenCalled();
    });

    it('tracks delivery lifecycle in database (PENDING -> ATTEMPTED -> SENT)', async () => {
      (service as any).prisma = mockPrisma;

      const result = await service.sendWelcomeEmail(
        'usr-789',
        'newuser@example.com',
        'Jane',
      );

      expect(result.status).toBe('SENT');
      expect(mockPrisma.emailDeliveryRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'usr-789',
          idempotencyKey: 'welcome-email:usr-789',
          emailType: 'WELCOME_EMAIL',
          recipientEmail: 'newuser@example.com',
          status: 'PENDING',
        }),
      });
      expect(mockPrisma.emailDeliveryRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idempotencyKey: 'welcome-email:usr-789' },
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('handles provider delivery errors safely and updates record to FAILED without throwing', async () => {
      (service as any).prisma = mockPrisma;
      mockProvider.send.mockRejectedValueOnce(
        new Error('Resend rate limit exceeded'),
      );

      const result = await service.sendWelcomeEmail(
        'usr-999',
        'user@example.com',
        'Swasthik',
      );

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Resend rate limit exceeded');
      expect(mockPrisma.emailDeliveryRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idempotencyKey: 'welcome-email:usr-999' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: 'Resend rate limit exceeded',
          }),
        }),
      );
    });

    it('gracefully skips sending when invalid email or userId is provided', async () => {
      const res1 = await service.sendWelcomeEmail('', 'valid@example.com');
      expect(res1.status).toBe('SKIPPED');

      const res2 = await service.sendWelcomeEmail('usr-1', 'not-an-email');
      expect(res2.status).toBe('SKIPPED');
      expect(mockProvider.send).not.toHaveBeenCalled();
    });
  });
});
