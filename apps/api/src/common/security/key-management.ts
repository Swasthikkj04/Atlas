import { createCipheriv, createDecipheriv, timingSafeEqual } from 'crypto';
import {
  CANONICAL_ENCRYPTION_CONFIG,
  MINIMUM_ENTROPY_BYTES,
} from './crypto-policy';
import { SecureRandomProvider } from './secure-random';

/**
 * S-06 Key Management & Cryptographic Separation Service
 *
 * Implements strict cryptographic key separation across planes (User, Admin, Data Encryption, Audit),
 * key lifecycle states (ACTIVE, ROTATING, RETIRED, REVOKED, DESTROYED), controlled rotation,
 * and authenticated symmetric encryption at rest (AES-256-GCM).
 */

export type KeyPurpose =
  | 'USER_AUTH'
  | 'ADMIN_AUTH'
  | 'DATA_ENCRYPTION'
  | 'AUDIT_CHAIN'
  | 'OAUTH_STATE';
export type KeyLifecycleState =
  'ACTIVE' | 'ROTATING' | 'RETIRED' | 'REVOKED' | 'DESTROYED';

export interface ManagedKey {
  kid: string;
  purpose: KeyPurpose;
  state: KeyLifecycleState;
  algorithm: string;
  secret: string | Buffer;
  createdAt: Date;
  activatedAt?: Date;
  retiredAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
}

export interface EncryptedDataPayload {
  ciphertext: string; // hex or base64
  iv: string; // hex
  tag: string; // hex
  kid: string;
  algorithm: string;
}

export class KeyManagementService {
  private readonly keyRing: Map<string, ManagedKey> = new Map();

  /**
   * Registers a managed key into the server keyring.
   */
  registerKey(key: ManagedKey): void {
    if (!key.kid || !key.secret || !key.purpose) {
      throw new Error('[S06-I08] Incomplete key metadata for registration.');
    }
    this.keyRing.set(key.kid, key);
  }

  /**
   * Retrieves an active key for a specific security purpose.
   * Enforces strict key separation and fails closed if no active key exists.
   */
  getActiveKey(purpose: KeyPurpose): ManagedKey {
    for (const key of this.keyRing.values()) {
      if (
        key.purpose === purpose &&
        (key.state === 'ACTIVE' || key.state === 'ROTATING')
      ) {
        return key;
      }
    }
    throw new Error(
      `[S06-I15] No active key available for purpose: ${purpose}`,
    );
  }

  /**
   * Retrieves a key by key identifier (kid) and validates its purpose and state.
   */
  getKey(kid: string, requiredPurpose?: KeyPurpose): ManagedKey {
    const key = this.keyRing.get(kid);
    if (!key) {
      throw new Error(
        `[S06-I15] Cryptographic key not found in keyring: ${kid}`,
      );
    }

    if (key.state === 'REVOKED') {
      throw new Error(`[S06-I08] Cryptographic key ${kid} is revoked.`);
    }

    if (key.state === 'DESTROYED') {
      throw new Error(`[S06-I08] Cryptographic key ${kid} is destroyed.`);
    }

    if (requiredPurpose && key.purpose !== requiredPurpose) {
      throw new Error(
        `[S06-I07] Key purpose mismatch! Expected ${requiredPurpose}, but key ${kid} is configured for ${key.purpose}`,
      );
    }

    return key;
  }

  /**
   * Evaluates whether two security operations are improperly sharing cryptographic key material.
   */
  static evaluateKeySeparation(
    userSigningKey: string,
    adminSigningKey: string,
    encryptionKey?: string,
  ): { valid: boolean; decision: string; reason?: string } {
    if (!userSigningKey || !adminSigningKey) {
      return {
        valid: false,
        decision: 'MISSING_KEY_FAIL_CLOSED',
        reason: 'Signing keys must be configured.',
      };
    }

    if (userSigningKey === adminSigningKey) {
      return {
        valid: false,
        decision: 'KEY_REUSE_BLOCKED',
        reason:
          'User and Admin security planes cannot share the same signing key material.',
      };
    }

    if (
      encryptionKey &&
      (encryptionKey === userSigningKey || encryptionKey === adminSigningKey)
    ) {
      return {
        valid: false,
        decision: 'KEY_REUSE_BLOCKED',
        reason:
          'Data encryption key cannot be shared with authentication signing keys.',
      };
    }

    return {
      valid: true,
      decision: 'KEYS_CRYPTOGRAPHICALLY_SEPARATED',
    };
  }

  /**
   * Performs authenticated symmetric encryption at rest using AES-256-GCM.
   */
  static encryptAtRest(
    plaintext: string,
    keySecret: string | Buffer,
    kid = 'data-enc-v1',
  ): EncryptedDataPayload {
    if (!plaintext || !keySecret) {
      throw new Error('[S06-I11] Plaintext and encryption key required.');
    }

    const keyBuffer =
      typeof keySecret === 'string'
        ? Buffer.from(keySecret.padEnd(32, '0').slice(0, 32), 'utf8')
        : keySecret;

    const iv = SecureRandomProvider.generateRandomBytes(
      CANONICAL_ENCRYPTION_CONFIG.ivLengthBytes,
    );
    const cipher = createCipheriv(
      CANONICAL_ENCRYPTION_CONFIG.cipher,
      keyBuffer,
      iv,
    );

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      kid,
      algorithm: CANONICAL_ENCRYPTION_CONFIG.cipher,
    };
  }

  /**
   * Decrypts ciphertext encrypted with AES-256-GCM.
   * Fails closed if the ciphertext is tampered, tag is invalid, or key is wrong.
   */
  static decryptAtRest(
    payload: EncryptedDataPayload,
    keySecret: string | Buffer,
  ): string {
    if (!payload.ciphertext || !payload.iv || !payload.tag || !keySecret) {
      throw new Error('[S06-I11] Incomplete payload for decryption.');
    }

    const keyBuffer =
      typeof keySecret === 'string'
        ? Buffer.from(keySecret.padEnd(32, '0').slice(0, 32), 'utf8')
        : keySecret;

    try {
      const decipher = createDecipheriv(
        CANONICAL_ENCRYPTION_CONFIG.cipher,
        keyBuffer,
        Buffer.from(payload.iv, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));

      let plaintext = decipher.update(payload.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');
      return plaintext;
    } catch {
      throw new Error(
        '[S06-I15] Authenticated decryption failed. Ciphertext or tag tampered.',
      );
    }
  }
}
