import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S06_TICKET_ID,
  S06_PHASE,
  S06_PRIORITY,
  S06_TYPE,
  S06_STATUS,
  S06_DEPENDS_ON,
  S06_BLOCKS,
  S06_PRINCIPLES,
  S06_INVARIANTS,
  S06_ATTACK_MATRIX,
  S06_CERTIFICATION_STATEMENT,
  S06_SECONDARY_GATE,
  S06_FROZEN_PRINCIPLE,
  auditFrontendSecrets,
  verifyS06Certification,
} from './s-06-secrets-crypto.contract.ts';

describe('S-06 — Secrets & Cryptographic Security Web Contract Spec', () => {
  describe('1. Web Security Contract & Invariants', () => {
    it('verifies metadata, dependencies, and blocking status', () => {
      assert.equal(S06_TICKET_ID, 'S-06');
      assert.equal(S06_PHASE, 'Production Security Hardening');
      assert.equal(S06_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S06_STATUS, 'CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY');
      assert.deepEqual(S06_DEPENDS_ON, ['S-01', 'S-02', 'S-03', 'S-04', 'S-05']);
      assert.ok(S06_BLOCKS.includes('Production Release'));
    });

    it('verifies frozen principle "Secrets never become application data"', () => {
      assert.equal(S06_FROZEN_PRINCIPLE, 'Secrets never become application data.');
      assert.ok(S06_PRINCIPLES.S06_P01_SECRETS_NEVER_APPLICATION_DATA.includes('frontend state'));
      assert.ok(S06_PRINCIPLES.S06_P03_GX_WX_ADMIN_CRYPTO_SEPARATION.includes('GX must never obtain WX cryptographic material'));
    });

    it('asserts all 15 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S06_INVARIANTS);
      assert.equal(keys.length, 15);
      assert.equal(S06_INVARIANTS['S06-I01'].failClosedDecision, 'CSPRNG_ENFORCED');
      assert.equal(S06_INVARIANTS['S06-I05'].failClosedDecision, 'HARDCODED_SECRET_BLOCKED');
      assert.equal(S06_INVARIANTS['S06-I07'].failClosedDecision, 'KEY_REUSE_BLOCKED');
      assert.equal(S06_INVARIANTS['S06-I10'].failClosedDecision, 'LOG_SECRET_REDACTED');
    });
  });

  describe('2. 45-Vector Attack Matrix Consistency', () => {
    it('matches exact 45 attack vector entries', () => {
      assert.equal(S06_ATTACK_MATRIX.length, 45);
      for (let i = 1; i <= 45; i++) {
        const id = `S06-${i < 10 ? '0' + i : i}`;
        const found = S06_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.expectedDecision);
      }
    });
  });

  describe('3. Frontend Secret Hygiene & Storage Audit', () => {
    it('passes for clean frontend state', () => {
      const state = {
        theme: 'dark',
        userId: 'usr_123',
        selectedWorkspaceId: 'ws_456',
        isAuthenticated: true,
      };
      const audit = auditFrontendSecrets(state);
      assert.equal(audit.secure, true);
      assert.equal(audit.leakedKeys.length, 0);
    });

    it('detects and flags leaked server secrets in frontend state', () => {
      const leakyState = {
        theme: 'dark',
        jwt_secret: 'super-secret-key',
        database_url: 'postgres://admin:pwd@db:5432/db',
        google_client_secret: 'GOCSPX-secret123',
      };
      const audit = auditFrontendSecrets(leakyState);
      assert.equal(audit.secure, false);
      assert.ok(audit.leakedKeys.includes('jwt_secret'));
      assert.ok(audit.leakedKeys.includes('database_url'));
      assert.ok(audit.leakedKeys.includes('google_client_secret'));
    });
  });

  describe('4. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS06Certification(S06_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS06Certification(S06_SECONDARY_GATE), true);
    });
  });
});
