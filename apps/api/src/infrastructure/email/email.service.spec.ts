import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import {
  EMAIL_PROVIDER,
  EmailProvider,
  SendEmailPayload,
} from './providers/email-provider.interface';

describe('AUTH-016: EmailService with Provider Abstraction', () => {
  let service: EmailService;
  let mockProvider: jest.Mocked<EmailProvider>;
  let configService: ConfigService;

  beforeEach(async () => {
    mockProvider = {
      send: jest.fn().mockResolvedValue(undefined),
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
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_FROM') return 'no-reply@argonion.com';
              if (key === 'APP_NAME') return 'Nebula';
              if (key === 'APP_URL') return 'http://localhost:5173';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendVerificationEmail', () => {
    it('constructs correct email payload with canonical /auth/verify-email URL and sends via provider', async () => {
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

      const expectedUrl = `http://localhost:5173/auth/verify-email?token=${rawToken}`;
      expect(payload.html).toContain(expectedUrl);
      expect(payload.html).toContain('Verify your email address');
      expect(payload.html).toContain('Swasthik');
      expect(payload.html).toContain('24 hours');

      expect(payload.text).toContain(expectedUrl);
      expect(payload.text).toContain('Swasthik');
      expect(payload.text).toContain('24 hours');
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
    it('constructs correct password reset payload with canonical URL and sends via provider', async () => {
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

      const expectedResetUrl = `http://localhost:5173/auth/reset-password?token=${rawResetToken}`;
      expect(payload.html).toContain(expectedResetUrl);
      expect(payload.html).toContain('1 hour');
      expect(payload.text).toContain(expectedResetUrl);
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
});
