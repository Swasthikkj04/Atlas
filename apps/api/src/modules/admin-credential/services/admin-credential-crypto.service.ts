import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ADMIN_CREDENTIAL_POLICY } from '../contracts/admin-credential.contract';

/**
 * ADMIN-002: Admin Credential Cryptography Service
 *
 * Dedicated high-assurance Argon2id password hashing and constant-time verification.
 */
@Injectable()
export class AdminCredentialCryptoService {
  /**
   * Hashes a primary admin password using Argon2id with high-assurance parameters.
   */
  async hashPrimaryPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: ADMIN_CREDENTIAL_POLICY.ARGON2_PARAMS.memoryCost,
      timeCost: ADMIN_CREDENTIAL_POLICY.ARGON2_PARAMS.timeCost,
      parallelism: ADMIN_CREDENTIAL_POLICY.ARGON2_PARAMS.parallelism,
    });
  }

  /**
   * Verifies a primary admin password against stored Argon2id verifier hash.
   * Fails closed if the hash is malformed or invalid.
   */
  async verifyPrimaryPassword(
    hash: string,
    password: string,
  ): Promise<boolean> {
    try {
      if (!hash || typeof hash !== 'string') {
        return false;
      }
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
