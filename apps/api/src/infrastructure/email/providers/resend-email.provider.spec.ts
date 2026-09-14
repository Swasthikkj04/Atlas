import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendEmailProvider } from './resend-email.provider';
import { DevelopmentEmailProvider } from './development-email.provider';
import { EMAIL_PROVIDER, SendEmailPayload } from './email-provider.interface';
import { EmailModule } from '../email.module';

const mockSend = jest.fn();

// Mock the official Resend SDK to ensure 100% network isolation (no calls to api.resend.com)
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation((apiKey?: string) => {
      return {
        key: apiKey,
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe('EMAIL-003: ResendEmailProvider Verification & Test Hardening', () => {
  let provider: ResendEmailProvider;
  let configService: ConfigService;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const FAKE_API_KEY = 're_test_fake_secret_123456789';

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSend.mockResolvedValue({
      data: { id: 'msg_resend_mock_abc123' },
      error: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RESEND_API_KEY') return FAKE_API_KEY;
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<ResendEmailProvider>(ResendEmailProvider);
    configService = module.get<ConfigService>(ConfigService);

    logSpy = jest.spyOn((provider as any).logger, 'log').mockImplementation();
    errorSpy = jest
      .spyOn((provider as any).logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('1. Provider Contract Tests (AC-01, AC-02)', () => {
    it('implements EmailProvider contract and sends exact payload to Resend SDK', async () => {
      const payload: SendEmailPayload = {
        to: 'recipient@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: 'hello@argonion.com',
        subject: 'Verify your Nebula account',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      };

      await expect(provider.send(payload)).resolves.toBeUndefined();

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];

      expect(callArgs).toEqual({
        from: 'Nebula <noreply@argonion.com>',
        to: 'recipient@example.com',
        replyTo: 'hello@argonion.com',
        subject: 'Verify your Nebula account',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      });

      // Assert exact keys with no injected tracking headers, tags, or attachments
      const allowedKeys = ['from', 'to', 'replyTo', 'subject', 'html', 'text'];
      expect(Object.keys(callArgs).sort()).toEqual(allowedKeys.sort());
    });

    it('does not mutate the caller SendEmailPayload object', async () => {
      const payload: SendEmailPayload = {
        to: 'recipient@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: 'hello@argonion.com',
        subject: 'Verify your Nebula account',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      };

      const payloadClone = { ...payload };
      await provider.send(payload);

      expect(payload).toEqual(payloadClone);
    });
  });

  describe('2. HTML and Plain-Text Preservation (AC-03)', () => {
    it('preserves complex HTML unchanged without stripping attributes or entities', async () => {
      const complexHtml =
        '<div class="container" style="color: #333;"><p>Hello &amp; welcome &lt;world&gt;!</p><a href="https://argonion.com/verify?token=abc-123&amp;ref=email">Verify</a></div>';
      const plainText =
        'Hello & welcome <world>!\n\nVerify: https://argonion.com/verify?token=abc-123&ref=email';

      const payload: SendEmailPayload = {
        to: 'user@argonion.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Complex HTML Test',
        html: complexHtml,
        text: plainText,
      };

      await provider.send(payload);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: complexHtml,
          text: plainText,
        }),
      );
    });

    it('preserves both HTML and text together in the same request', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Dual Format',
        html: '<h1>Title</h1>',
        text: 'Title',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toBe('<h1>Title</h1>');
      expect(callArgs.text).toBe('Title');
    });

    it('handles empty but valid string plain-text according to contract', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Empty Text',
        html: '<p>Only HTML</p>',
        text: '',
      };

      await provider.send(payload);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<p>Only HTML</p>',
          text: '',
        }),
      );
    });
  });

  describe('3. Reply-To Tests (AC-04)', () => {
    it('includes replyTo when supplied', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: 'support@argonion.com',
        subject: 'Support Ticket',
        html: '<p>Reply here</p>',
        text: 'Reply here',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.replyTo).toBe('support@argonion.com');
    });

    it('trims leading/trailing whitespace when replyTo is provided', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: '  support@argonion.com  ',
        subject: 'Support Ticket',
        html: '<p>Reply here</p>',
        text: 'Reply here',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.replyTo).toBe('support@argonion.com');
    });

    it('omits replyTo key entirely when replyTo is absent/undefined', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'No ReplyTo',
        html: '<p>No ReplyTo</p>',
        text: 'No ReplyTo',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect('replyTo' in callArgs).toBe(false);
    });

    it('omits replyTo key entirely when replyTo is empty string', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: '',
        subject: 'Empty ReplyTo',
        html: '<p>Empty ReplyTo</p>',
        text: 'Empty ReplyTo',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect('replyTo' in callArgs).toBe(false);
    });

    it('omits replyTo key entirely when replyTo is whitespace only', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        replyTo: '     ',
        subject: 'Whitespace ReplyTo',
        html: '<p>Whitespace ReplyTo</p>',
        text: 'Whitespace ReplyTo',
      };

      await provider.send(payload);

      const callArgs = mockSend.mock.calls[0][0];
      expect('replyTo' in callArgs).toBe(false);
    });
  });

  describe('4. Success Response Handling (AC-05)', () => {
    it('resolves without error and logs safe dispatch info without claiming final delivery', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'msg_resend_prod_9988' },
        error: null,
      });

      const payload: SendEmailPayload = {
        to: 'alex@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Verify Account',
        html: '<p>Verify</p>',
        text: 'Verify',
      };

      await expect(provider.send(payload)).resolves.toBeUndefined();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const logMessage = logSpy.mock.calls[0][0];

      // Verify safe metadata and wording (dispatched/submitted, NOT claiming final delivery confirmation)
      expect(logMessage).toContain('Dispatched');
      expect(logMessage).not.toContain('delivered successfully');
      expect(logMessage).not.toContain('delivery confirmed');
      expect(logMessage).toContain('provider=resend');
      expect(logMessage).toContain('recipientDomain=example.com');
      expect(logMessage).toContain('messageId=msg_resend_prod_9988');

      // Verify no sensitive email body or secret key in log
      expect(logMessage).not.toContain(FAKE_API_KEY);
      expect(logMessage).not.toContain('<p>Verify</p>');
    });

    it('handles success response when data.id is undefined/null gracefully', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const payload: SendEmailPayload = {
        to: 'alex@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Verify Account',
        html: '<p>Verify</p>',
        text: 'Verify',
      };

      await expect(provider.send(payload)).resolves.toBeUndefined();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const logMessage = logSpy.mock.calls[0][0];
      expect(logMessage).toContain('messageId=unknown');
    });
  });

  describe('5. Error Classification Tests (AC-06)', () => {
    const testPayload: SendEmailPayload = {
      to: 'target@example.com',
      from: 'Nebula <noreply@argonion.com>',
      subject: 'Error Test',
      html: '<p>Error Test Body</p>',
      text: 'Error Test Body',
    };

    it('classifies invalid API key (401) as authentication_error and throws safe error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'invalid_api_key',
          message: 'The API key provided is invalid or expired.',
          statusCode: 401,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'The API key provided is invalid or expired.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=authentication_error');
      expect(errLog).toContain('statusCode=401');
      expect(errLog).toContain('recipientDomain=example.com');
    });

    it('classifies restricted API key (403) as authentication_error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'restricted_api_key',
          message: 'API key does not have sending permissions.',
          statusCode: 403,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'API key does not have sending permissions.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=authentication_error');
      expect(errLog).toContain('statusCode=403');
    });

    it('classifies validation error (422) as validation_error without logging email body', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'validation_error',
          message: 'The to field is required.',
          statusCode: 422,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'The to field is required.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=validation_error');
      expect(errLog).toContain('statusCode=422');
      expect(errLog).not.toContain('<p>Error Test Body</p>');
    });

    it('classifies missing required field (400) as validation_error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'missing_required_field',
          message: 'Missing "from" address in payload.',
          statusCode: 400,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Missing "from" address in payload.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=validation_error');
      expect(errLog).toContain('statusCode=400');
    });

    it('classifies rate limit error (429) as rate_limit without speculative retries', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'rate_limit_exceeded',
          message: 'Too many requests. Please back off.',
          statusCode: 429,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Too many requests. Please back off.',
      );

      expect(mockSend).toHaveBeenCalledTimes(1); // Confirm no fake retry loop
      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=rate_limit');
      expect(errLog).toContain('statusCode=429');
    });

    it('classifies internal server error (500) as server_error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'internal_server_error',
          message: 'Resend service experiencing internal error.',
          statusCode: 500,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Resend service experiencing internal error.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=server_error');
      expect(errLog).toContain('statusCode=500');
    });

    it('classifies HTTP 502/503 server outages as server_error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'application_error',
          message: 'Bad Gateway upstream.',
          statusCode: 502,
        },
      });

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Bad Gateway upstream.',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=server_error');
      expect(errLog).toContain('statusCode=502');
    });

    it('classifies network failure (fetch failed / ECONNREFUSED) as network_error', async () => {
      mockSend.mockRejectedValueOnce(
        new Error(
          'fetch failed: request to https://api.resend.com failed with ECONNREFUSED',
        ),
      );

      await expect(provider.send(testPayload)).rejects.toThrow(
        'fetch failed: request to https://api.resend.com failed with ECONNREFUSED',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=network_error');
      expect(errLog).toContain('ECONNREFUSED');
    });

    it('classifies network timeout (ETIMEDOUT) as network_error', async () => {
      mockSend.mockRejectedValueOnce(
        new Error('Socket operation timed out: ETIMEDOUT'),
      );

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Socket operation timed out: ETIMEDOUT',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=network_error');
    });

    it('classifies connection reset (ECONNRESET) as network_error', async () => {
      mockSend.mockRejectedValueOnce(
        new Error('Connection reset by peer: ECONNRESET'),
      );

      await expect(provider.send(testPayload)).rejects.toThrow(
        'Connection reset by peer: ECONNRESET',
      );

      const errLog = errorSpy.mock.calls[0][0];
      expect(errLog).toContain('errorCategory=network_error');
    });
  });

  describe('6. Secret-Leakage & Data Protection Tests (AC-07, AC-08)', () => {
    it('redacts fake secret key from thrown error message if included in upstream message', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'invalid_api_key',
          message: `Authorization failed with key: ${FAKE_API_KEY}`,
          statusCode: 401,
        },
      });

      const payload: SendEmailPayload = {
        to: 'user@argonion.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Secret Test',
        html: '<p>Secret Body</p>',
        text: 'Secret Body',
      };

      try {
        await provider.send(payload);
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).not.toContain(FAKE_API_KEY);
        expect(err.message).toContain('[REDACTED]');
      }
    });

    it('redacts fake secret key from logger output if included in upstream error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'invalid_api_key',
          message: `Authorization failed with key: ${FAKE_API_KEY}`,
          statusCode: 401,
        },
      });

      const payload: SendEmailPayload = {
        to: 'user@argonion.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Secret Test',
        html: '<p>Secret Body</p>',
        text: 'Secret Body',
      };

      await expect(provider.send(payload)).rejects.toThrow();

      const allLoggedMessages = [
        ...errorSpy.mock.calls.map((c) => c[0]),
        ...logSpy.mock.calls.map((c) => c[0]),
      ].join(' ');

      expect(allLoggedMessages).not.toContain(FAKE_API_KEY);
      expect(allLoggedMessages).toContain('[REDACTED]');
    });

    it('does not log full recipient email address, only recipient domain', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'msg_abc' },
        error: null,
      });

      const payload: SendEmailPayload = {
        to: 'john.sensitive.user@corporate-domain.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Domain Logging Test',
        html: '<p>Body</p>',
        text: 'Body',
      };

      await provider.send(payload);

      const logMsg = logSpy.mock.calls[0][0];
      expect(logMsg).toContain('recipientDomain=corporate-domain.com');
      expect(logMsg).not.toContain('john.sensitive.user');
    });

    it('does not log email body content in success or error logs', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: {
          name: 'rate_limit_exceeded',
          message: 'Limit hit',
          statusCode: 429,
        },
      });

      const secretEmailBody =
        '<p>SUPER_CONFIDENTIAL_VERIFICATION_TOKEN_9999</p>';
      const payload: SendEmailPayload = {
        to: 'target@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Confidential Email',
        html: secretEmailBody,
        text: 'SUPER_CONFIDENTIAL_VERIFICATION_TOKEN_9999',
      };

      await expect(provider.send(payload)).rejects.toThrow();

      const errorLog = errorSpy.mock.calls[0][0];
      expect(errorLog).not.toContain(secretEmailBody);
      expect(errorLog).not.toContain(
        'SUPER_CONFIDENTIAL_VERIFICATION_TOKEN_9999',
      );
    });
  });

  describe('7. Network Isolation Guarantee (AC-08, AC-09)', () => {
    it('uses mocked Resend SDK and makes zero network calls to api.resend.com', async () => {
      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Network Isolation Test',
        html: '<p>Isolation</p>',
        text: 'Isolation',
      };

      await provider.send(payload);

      // Verify that Resend constructor was called with fake credentials through mock
      expect(Resend).toHaveBeenCalledWith(FAKE_API_KEY);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('8. Configuration Tests (AC-06, AC-08)', () => {
    it('reads RESEND_API_KEY from ConfigService upon initialization', () => {
      expect(configService.get).toHaveBeenCalledWith('RESEND_API_KEY');
    });

    it('throws safe error if RESEND_API_KEY is missing when send is invoked', async () => {
      const mockMissingKeyConfigService: ConfigService = {
        get: jest.fn((key: string) =>
          key === 'RESEND_API_KEY' ? undefined : null,
        ),
      } as any;

      const unconfiguredProvider = new ResendEmailProvider(
        mockMissingKeyConfigService,
      );
      const unconfigErrorSpy = jest
        .spyOn((unconfiguredProvider as any).logger, 'error')
        .mockImplementation();

      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Unconfigured Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      await expect(unconfiguredProvider.send(payload)).rejects.toThrow(
        'Resend API key is not configured.',
      );

      expect(mockSend).not.toHaveBeenCalled();
      const errLog = unconfigErrorSpy.mock.calls[0][0];
      expect(errLog).toContain('RESEND_API_KEY is not configured');
      expect(errLog).toContain('event=email_send_failed');
    });

    it('throws safe error if RESEND_API_KEY is empty or whitespace-only', async () => {
      const mockWhitespaceKeyConfigService: ConfigService = {
        get: jest.fn((key: string) =>
          key === 'RESEND_API_KEY' ? '   ' : null,
        ),
      } as any;

      const unconfiguredProvider = new ResendEmailProvider(
        mockWhitespaceKeyConfigService,
      );

      const payload: SendEmailPayload = {
        to: 'user@example.com',
        from: 'Nebula <noreply@argonion.com>',
        subject: 'Whitespace Key Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      await expect(unconfiguredProvider.send(payload)).rejects.toThrow(
        'Resend API key is not configured.',
      );
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('9. Module Factory & Provider Selection Tests (AC-10, AC-11)', () => {
    it('selects ResendEmailProvider when EMAIL_PROVIDER=resend', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [EmailModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            if (key === 'EMAIL_PROVIDER') return 'resend';
            if (key === 'RESEND_API_KEY') return FAKE_API_KEY;
            return null;
          }),
        })
        .compile();

      const selectedProvider = module.get(EMAIL_PROVIDER);
      expect(selectedProvider).toBeInstanceOf(ResendEmailProvider);
    });

    it('selects DevelopmentEmailProvider when EMAIL_PROVIDER=development', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [EmailModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            if (key === 'EMAIL_PROVIDER') return 'development';
            return null;
          }),
        })
        .compile();

      const selectedProvider = module.get(EMAIL_PROVIDER);
      expect(selectedProvider).toBeInstanceOf(DevelopmentEmailProvider);
    });

    it('defaults to DevelopmentEmailProvider when EMAIL_PROVIDER is missing or unknown', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [EmailModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            if (key === 'EMAIL_PROVIDER') return undefined;
            return null;
          }),
        })
        .compile();

      const selectedProvider = module.get(EMAIL_PROVIDER);
      expect(selectedProvider).toBeInstanceOf(DevelopmentEmailProvider);
    });

    it('falls back to DevelopmentEmailProvider for other provider names (smtp, ses, sendgrid, postmark)', async () => {
      for (const providerName of ['smtp', 'ses', 'sendgrid', 'postmark']) {
        const module: TestingModule = await Test.createTestingModule({
          imports: [EmailModule],
        })
          .overrideProvider(ConfigService)
          .useValue({
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_PROVIDER') return providerName;
              return null;
            }),
          })
          .compile();

        const selectedProvider = module.get(EMAIL_PROVIDER);
        expect(selectedProvider).toBeInstanceOf(DevelopmentEmailProvider);
      }
    });
  });
});
