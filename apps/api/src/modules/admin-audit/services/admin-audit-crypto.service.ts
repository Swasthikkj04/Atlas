import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AdminAuditChainVerificationResultDto,
  AdminAuditEventDto,
} from '../contracts/admin-audit.contract';

export const GENESIS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000';

const FORBIDDEN_METADATA_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'refreshtokenhash',
  'secret',
  'accesstoken',
  'token',
  'privatekey',
  'publickey',
  'challenge',
  'clientdatajson',
  'authenticatordata',
  'signature',
]);

@Injectable()
export class AdminAuditCryptoService {
  /**
   * Strips any sensitive credentials or secrets from audit metadata before hashing and persistence.
   */
  sanitizeMetadata(
    metadata?: Record<string, any> | null,
  ): Record<string, any> | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_METADATA_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED_SECURITY_MATERIAL]';
      } else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Computes deterministic SHA-256 event hash linking to the previous event hash.
   */
  computeEventHash(input: {
    previousHash: string;
    action: string;
    category: string;
    adminId?: string | null;
    sessionId?: string | null;
    credentialId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    outcome: string;
    createdAt: Date;
    metadata?: Record<string, any> | null;
  }): string {
    const sanitizedMeta = this.sanitizeMetadata(input.metadata);
    const canonicalPayload = JSON.stringify({
      previousHash: input.previousHash,
      action: input.action,
      category: input.category,
      adminId: input.adminId || null,
      sessionId: input.sessionId || null,
      credentialId: input.credentialId || null,
      targetType: input.targetType || null,
      targetId: input.targetId || null,
      outcome: input.outcome,
      createdAt: input.createdAt.toISOString(),
      metadata: sanitizedMeta,
    });

    return createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  }

  /**
   * Verifies the cryptographic continuity of an audit event chain.
   */
  verifyChain(
    events: AdminAuditEventDto[],
  ): AdminAuditChainVerificationResultDto {
    if (!events || events.length === 0) {
      return {
        valid: true,
        totalEventsVerified: 0,
        genesisHash: GENESIS_HASH,
        latestHash: GENESIS_HASH,
      };
    }

    let expectedPreviousHash = GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const actualPreviousHash = event.previousHash || GENESIS_HASH;

      // 1. Verify previous hash pointer matches expected link
      if (actualPreviousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalEventsVerified: i,
          genesisHash: GENESIS_HASH,
          latestHash: expectedPreviousHash,
          brokenIndex: i,
          tamperedEventId: event.id,
          details: `Broken previousHash linkage at event index ${i} (ID: ${event.id}). Expected ${expectedPreviousHash}, got ${actualPreviousHash}`,
        };
      }

      // 2. Recompute expected event hash and verify integrity
      const computedHash = this.computeEventHash({
        previousHash: actualPreviousHash,
        action: event.action,
        category: event.category,
        adminId: event.adminId,
        sessionId: event.sessionId,
        credentialId: event.credentialId,
        targetType: event.targetType,
        targetId: event.targetId,
        outcome: event.outcome,
        createdAt: new Date(event.createdAt),
        metadata: event.metadata,
      });

      if (computedHash !== event.eventHash) {
        return {
          valid: false,
          totalEventsVerified: i,
          genesisHash: GENESIS_HASH,
          latestHash: actualPreviousHash,
          brokenIndex: i,
          tamperedEventId: event.id,
          details: `Tampered event payload at event index ${i} (ID: ${event.id}). Stored hash: ${event.eventHash}, Computed hash: ${computedHash}`,
        };
      }

      expectedPreviousHash = event.eventHash;
    }

    return {
      valid: true,
      totalEventsVerified: events.length,
      genesisHash: GENESIS_HASH,
      latestHash: expectedPreviousHash,
    };
  }
}
