import {
  AdminAuditCryptoService,
  GENESIS_HASH,
} from './admin-audit-crypto.service';
import { AdminAuditEventDto } from '../contracts/admin-audit.contract';

describe('AdminAuditCryptoService (ADMIN-008)', () => {
  let service: AdminAuditCryptoService;

  beforeEach(() => {
    service = new AdminAuditCryptoService();
  });

  describe('sanitizeMetadata', () => {
    it('redacts sensitive security credentials from metadata', () => {
      const rawMeta = {
        adminIp: '127.0.0.1',
        password: 'SuperSecretPassword!',
        passwordHash: '$argon2id$v=19$m=65536...',
        token: 'eyJhbGciOi...',
        privateKey: '-----BEGIN PRIVATE KEY-----',
        challenge: 'raw-challenge-string',
        nested: {
          refreshToken: 'secret-refresh-token',
          safeField: 'harmless-value',
        },
      };

      const sanitized = service.sanitizeMetadata(rawMeta);

      expect(sanitized).toBeDefined();
      expect(sanitized?.adminIp).toBe('127.0.0.1');
      expect(sanitized?.password).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.passwordHash).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.token).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.privateKey).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.challenge).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.nested?.refreshToken).toBe(
        '[REDACTED_SECURITY_MATERIAL]',
      );
      expect(sanitized?.nested?.safeField).toBe('harmless-value');
    });

    it('returns null for empty or non-object metadata', () => {
      expect(service.sanitizeMetadata(null)).toBeNull();
      expect(service.sanitizeMetadata(undefined)).toBeNull();
    });
  });

  describe('computeEventHash', () => {
    it('produces deterministic SHA-256 hash', () => {
      const date = new Date('2026-08-29T12:00:00.000Z');
      const input = {
        previousHash: GENESIS_HASH,
        action: 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
        category: 'AUTHENTICATION',
        adminId: 'adm-001',
        sessionId: 'sess-001',
        outcome: 'SUCCESS',
        createdAt: date,
        metadata: { ip: '127.0.0.1' },
      };

      const hash1 = service.computeEventHash(input);
      const hash2 = service.computeEventHash(input);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes when any input parameter differs', () => {
      const date = new Date('2026-08-29T12:00:00.000Z');
      const baseInput = {
        previousHash: GENESIS_HASH,
        action: 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
        category: 'AUTHENTICATION',
        adminId: 'adm-001',
        sessionId: 'sess-001',
        outcome: 'SUCCESS',
        createdAt: date,
      };

      const hash1 = service.computeEventHash(baseInput);
      const hash2 = service.computeEventHash({
        ...baseInput,
        action: 'ADMIN_WEBAUTHN_AUTHENTICATION_FAILED',
      });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyChain', () => {
    it('validates a valid tamper-free audit chain from Genesis to tip', () => {
      const events: AdminAuditEventDto[] = [];
      let prev = GENESIS_HASH;

      for (let i = 0; i < 5; i++) {
        const createdAt = new Date(Date.now() + i * 1000);
        const action = `ACTION_${i}`;
        const eventHash = service.computeEventHash({
          previousHash: prev,
          action,
          category: 'SECURITY',
          adminId: 'adm-001',
          outcome: 'SUCCESS',
          createdAt,
        });

        events.push({
          id: `evt-${i}`,
          adminId: 'adm-001',
          action,
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: prev,
          eventHash,
          createdAt,
        });

        prev = eventHash;
      }

      const verification = service.verifyChain(events);
      expect(verification.valid).toBe(true);
      expect(verification.totalEventsVerified).toBe(5);
      expect(verification.genesisHash).toBe(GENESIS_HASH);
      expect(verification.latestHash).toBe(prev);
    });

    it('detects broken previousHash linkage', () => {
      const date = new Date('2026-08-29T12:00:00.000Z');
      const event1Hash = service.computeEventHash({
        previousHash: GENESIS_HASH,
        action: 'ACTION_1',
        category: 'SECURITY',
        outcome: 'SUCCESS',
        createdAt: date,
      });

      const events: AdminAuditEventDto[] = [
        {
          id: 'evt-1',
          action: 'ACTION_1',
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: GENESIS_HASH,
          eventHash: event1Hash,
          createdAt: date,
        },
        {
          id: 'evt-2',
          action: 'ACTION_2',
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: 'forged-or-incorrect-previous-hash',
          eventHash: 'some-hash',
          createdAt: new Date(date.getTime() + 1000),
        },
      ];

      const verification = service.verifyChain(events);
      expect(verification.valid).toBe(false);
      expect(verification.brokenIndex).toBe(1);
      expect(verification.tamperedEventId).toBe('evt-2');
    });

    it('detects tampered payload content in an event', () => {
      const date = new Date('2026-08-29T12:00:00.000Z');
      const event1Hash = service.computeEventHash({
        previousHash: GENESIS_HASH,
        action: 'ACTION_1',
        category: 'SECURITY',
        outcome: 'SUCCESS',
        createdAt: date,
      });

      const events: AdminAuditEventDto[] = [
        {
          id: 'evt-1',
          action: 'ACTION_1_TAMPERED', // Tampered action with original hash
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: GENESIS_HASH,
          eventHash: event1Hash,
          createdAt: date,
        },
      ];

      const verification = service.verifyChain(events);
      expect(verification.valid).toBe(false);
      expect(verification.brokenIndex).toBe(0);
      expect(verification.tamperedEventId).toBe('evt-1');
    });
  });
});
