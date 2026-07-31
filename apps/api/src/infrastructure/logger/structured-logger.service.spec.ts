import { RequestContextStore } from './request-context.store';
import { redactSensitiveData } from './sensitive-data.redactor';
import { StructuredLoggerService } from './structured-logger.service';

describe('StructuredLoggerService & Correlation Infrastructure', () => {
  let loggerService: StructuredLoggerService;

  beforeEach(() => {
    loggerService = new StructuredLoggerService();
  });

  describe('1. Structured JSON Log Output', () => {
    it('should format log output as valid structured JSON with standard fields', () => {
      const logStr = loggerService.formatLog(
        'INFO',
        'Test log message',
        'TestModule',
      );
      const parsed = JSON.parse(logStr);

      expect(parsed).toHaveProperty('timestamp');
      expect(parsed.level).toBe('INFO');
      expect(parsed.service).toBe('atlas-api');
      expect(parsed.module).toBe('TestModule');
      expect(parsed.message).toBe('Test log message');
      expect(parsed.correlationId).toBeDefined();
      expect(parsed.requestId).toBeDefined();
    });

    it('should capture active correlation ID and user ID from AsyncLocalStorage', () => {
      RequestContextStore.run(
        {
          correlationId: 'corr_test_123',
          requestId: 'req_test_456',
          userId: 'user_789',
          startTime: Date.now(),
        },
        () => {
          const logStr = loggerService.formatLog(
            'INFO',
            'User action log',
            'UserService',
          );
          const parsed = JSON.parse(logStr);

          expect(parsed.correlationId).toBe('corr_test_123');
          expect(parsed.requestId).toBe('req_test_456');
          expect(parsed.userId).toBe('user_789');
        },
      );
    });
  });

  describe('2. Sensitive Data Redaction', () => {
    it('should redact passwords, tokens, authorization headers, and secrets', () => {
      const sensitivePayload = {
        username: 'john_doe',
        password: 'SuperSecretPassword123!',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
        authorization: 'Bearer token_123',
        secret: 'api_secret_key_456',
      };

      const redacted = redactSensitiveData(sensitivePayload);

      expect(redacted.username).toBe('john_doe');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.accessToken).toBe('[REDACTED]');
      expect(redacted.authorization).toBe('[REDACTED]');
      expect(redacted.secret).toBe('[REDACTED]');
    });
  });
});
