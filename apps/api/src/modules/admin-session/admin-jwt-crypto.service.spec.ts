import { Test, TestingModule } from '@nestjs/testing';
import { AdminJwtCryptoService } from './services/admin-jwt-crypto.service';
import { ADMIN_AUTH_POLICY } from './contracts/admin-session.contract';
import {
  AdminJwtExpiredException,
  AdminJwtInvalidException,
  AdminTokenTamperedException,
} from './exceptions/admin-session.exception';

describe('ADMIN-005: AdminJwtCryptoService & Key Rotation', () => {
  let service: AdminJwtCryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminJwtCryptoService],
    }).compile();

    service = module.get<AdminJwtCryptoService>(AdminJwtCryptoService);
  });

  describe('1. Token Signing & Claims Structure', () => {
    it('signs an Admin JWT with authoritative claims and short-lived expiration (900s)', () => {
      const result = service.signAdminToken({
        adminIdentityId: 'adm-00000001',
        sessionId: 'ses-00000001',
        identifier: 'platform-owner',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBe(ADMIN_AUTH_POLICY.jwtTtlSeconds);

      const parts = result.accessToken.split('.');
      expect(parts.length).toBe(3);

      const header = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf8'),
      );
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
      expect(header.kid).toBe(ADMIN_AUTH_POLICY.activeKeyId);

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      );
      expect(payload.iss).toBe('nebula-admin');
      expect(payload.aud).toBe('nebula-admin-api');
      expect(payload.typ).toBe('admin-access');
      expect(payload.sub).toBe('adm-00000001');
      expect(payload.sid).toBe('ses-00000001');
      expect(payload.identifier).toBe('platform-owner');
      expect(payload.aal).toBe('AAL3');
    });
  });

  describe('2. Token Verification & Tamper Resistance', () => {
    it('successfully verifies a freshly minted Admin JWT', () => {
      const { accessToken } = service.signAdminToken({
        adminIdentityId: 'adm-00000001',
        sessionId: 'ses-00000001',
        identifier: 'platform-owner',
      });

      const payload = service.verifyAdminToken(accessToken);
      expect(payload.sub).toBe('adm-00000001');
      expect(payload.sid).toBe('ses-00000001');
      expect(payload.typ).toBe('admin-access');
    });

    it('rejects tampered token signature', () => {
      const { accessToken } = service.signAdminToken({
        adminIdentityId: 'adm-00000001',
        sessionId: 'ses-00000001',
        identifier: 'platform-owner',
      });

      const parts = accessToken.split('.');
      const tamperedSignature = parts[2] + 'tampered';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      expect(() => service.verifyAdminToken(tamperedToken)).toThrow(
        AdminTokenTamperedException,
      );
    });

    it('rejects tampered token payload', () => {
      const { accessToken } = service.signAdminToken({
        adminIdentityId: 'adm-00000001',
        sessionId: 'ses-00000001',
        identifier: 'platform-owner',
      });

      const parts = accessToken.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      );
      payload.sub = 'hacker-elevated-id';
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString(
        'base64url',
      );
      const tamperedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

      expect(() => service.verifyAdminToken(tamperedToken)).toThrow(
        AdminTokenTamperedException,
      );
    });

    it('rejects malformed token strings', () => {
      expect(() => service.verifyAdminToken('invalid-non-jwt-string')).toThrow(
        AdminJwtInvalidException,
      );
      expect(() => service.verifyAdminToken('')).toThrow(
        AdminJwtInvalidException,
      );
    });
  });
});
