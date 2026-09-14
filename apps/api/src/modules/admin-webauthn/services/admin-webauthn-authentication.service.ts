import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialStatus } from '../../admin-credential/contracts/admin-credential.contract';
import { AdminAnomalyDetectionService } from '../../admin-audit/services/admin-anomaly-detection.service';
import {
  ADMIN_WEBAUTHN_POLICY,
  AdminWebAuthnAuditEvent,
  AuthenticatedAdminResult,
} from '../contracts/admin-webauthn.contract';
import {
  AdminWebAuthnChallengeExpiredException,
  AdminWebAuthnChallengeInvalidException,
  AdminWebAuthnAuthenticationFailedException,
  AdminWebAuthnAuthenticatorRejectedException,
} from '../exceptions/admin-webauthn.exception';
import { InitiateWebAuthnAuthenticationDto } from '../dto/initiate-webauthn-authentication.dto';
import { VerifyWebAuthnAuthenticationDto } from '../dto/verify-webauthn-authentication.dto';

@Injectable()
export class AdminWebAuthnAuthenticationService {
  private readonly logger = new Logger(AdminWebAuthnAuthenticationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly anomalyDetectionService?: AdminAnomalyDetectionService,
  ) {}

  /**
   * Step 1: Initiates WebAuthn Passkey authentication ceremony for the owner Admin identity.
   *
   * Invariants:
   * - Resolves single owner Admin identity and verifies ACTIVE status.
   * - Retrieves all ACTIVE enrolled passkeys to populate allowCredentials.
   * - Generates cryptographically secure, single-use, 5-minute authentication challenge.
   * - Requires User Verification ('required').
   * - Emits ADMIN_WEBAUTHN_AUTHENTICATION_STARTED audit event.
   */
  async initiateAuthentication(
    dto: InitiateWebAuthnAuthenticationDto,
  ): Promise<{
    options: PublicKeyCredentialRequestOptionsJSON;
    challenge: string;
  }> {
    const normalizedIdentifier = dto.identifier.trim().toLowerCase();

    // 1. Resolve Admin identity
    const admin = await this.prisma.adminIdentity.findUnique({
      where: { identifier: normalizedIdentifier },
    });

    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      this.logger.warn(
        `WebAuthn auth initiation rejected for inactive/unknown identifier: ${normalizedIdentifier}`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        'Authentication ceremony initiation failed.',
      );
    }

    // 2. Resolve all ACTIVE passkeys for this Admin
    const activePasskeys = await this.prisma.adminWebAuthnCredential.findMany({
      where: {
        adminId: admin.id,
        status: AdminCredentialStatus.ACTIVE,
      },
    });

    if (activePasskeys.length === 0) {
      this.logger.warn(
        `No active WebAuthn passkeys found for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        'No active WebAuthn credentials enrolled for this Admin identity.',
      );
    }

    // 3. Build allowCredentials list
    const allowCredentials = activePasskeys.map((k) => ({
      id: k.credentialId,
      transports: (k.transports || []) as any,
    }));

    // 4. Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: ADMIN_WEBAUTHN_POLICY.rpId,
      allowCredentials,
      userVerification: 'required',
      timeout: ADMIN_WEBAUTHN_POLICY.challengeTtlMs,
    });

    // 5. Persist single-use authentication challenge
    await this.prisma.adminWebAuthnChallenge.create({
      data: {
        adminId: admin.id,
        challenge: options.challenge,
        purpose: 'AUTHENTICATION',
        expiresAt: new Date(Date.now() + ADMIN_WEBAUTHN_POLICY.challengeTtlMs),
      },
    });

    // 6. Emit audit event
    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_STARTED}] Admin [${admin.id}] initiated WebAuthn authentication ceremony.`,
    );

    return {
      options,
      challenge: options.challenge,
    };
  }

  /**
   * Step 2: Cryptographically verifies the authenticator assertion and returns the internal AuthenticatedAdminResult.
   *
   * Invariants:
   * - Challenge must exist, belong to Admin, purpose = AUTHENTICATION, unconsumed, unexpired.
   * - Challenge consumed atomically immediately (anti-replay defense).
   * - Authenticator signature verified against stored public key via @simplewebauthn/server.
   * - Counter validation / clone detection performed.
   * - No password fallback or OAuth bypass.
   * - Produces internal AuthenticatedAdminResult (ADMIN-005 issues session/JWT).
   * - Emits ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED or ADMIN_WEBAUTHN_AUTHENTICATION_FAILED / REJECTED.
   */
  async verifyAuthentication(
    dto: VerifyWebAuthnAuthenticationDto,
  ): Promise<AuthenticatedAdminResult> {
    const normalizedIdentifier = dto.identifier.trim().toLowerCase();

    // 1. Resolve Admin identity
    const admin = await this.prisma.adminIdentity.findUnique({
      where: { identifier: normalizedIdentifier },
    });

    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      this.logger.warn(
        `WebAuthn auth verification rejected for inactive/unknown Admin [${normalizedIdentifier}]`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        'Admin identity is inactive or does not exist.',
      );
    }

    // 2. Lookup and validate single-use challenge
    let rawChallenge = dto.challenge;
    const clientDataB64 =
      (dto.response as any)?.response?.clientDataJSON ||
      (dto.response as any)?.clientDataJSON;
    if (!rawChallenge && clientDataB64) {
      try {
        const parsed = JSON.parse(
          Buffer.from(clientDataB64, 'base64url').toString('utf-8'),
        );
        rawChallenge = parsed.challenge;
      } catch (e) {
        // Fallback to active challenge lookup
      }
    }

    let challengeRecord = rawChallenge
      ? await this.prisma.adminWebAuthnChallenge.findUnique({
          where: { challenge: rawChallenge },
        })
      : null;

    if (!challengeRecord) {
      challengeRecord = await this.prisma.adminWebAuthnChallenge.findFirst({
        where: {
          adminId: admin.id,
          purpose: 'AUTHENTICATION',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (
      !challengeRecord ||
      challengeRecord.adminId !== admin.id ||
      challengeRecord.purpose !== 'AUTHENTICATION'
    ) {
      this.logger.warn(
        `Authentication challenge mismatch or invalid for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnChallengeInvalidException(
        'Authentication challenge not found or mismatched.',
      );
    }

    if (challengeRecord.consumedAt !== null) {
      this.logger.warn(
        `Attempted replay of already consumed authentication challenge for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnChallengeInvalidException(
        'Challenge has already been consumed.',
      );
    }

    if (challengeRecord.expiresAt < new Date()) {
      this.logger.warn(
        `Expired authentication challenge for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnChallengeExpiredException(
        'Authentication challenge has expired.',
      );
    }

    // 3. Atomically consume challenge immediately (Replay defense)
    await this.prisma.adminWebAuthnChallenge.update({
      where: { id: challengeRecord.id },
      data: { consumedAt: new Date() },
    });

    // 4. Resolve passkey credential
    const passkey = await this.prisma.adminWebAuthnCredential.findUnique({
      where: { credentialId: dto.response.id },
    });

    if (
      !passkey ||
      passkey.adminId !== admin.id ||
      passkey.status !== AdminCredentialStatus.ACTIVE
    ) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_FAILED}] Passkey [${dto.response.id}] not active or mismatched for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        'Active WebAuthn passkey credential not found.',
      );
    }

    // 5. Cryptographic signature verification via @simplewebauthn/server
    let verification: any;
    try {
      verification = await verifyAuthenticationResponse({
        response: dto.response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: ADMIN_WEBAUTHN_POLICY.origins,
        expectedRPID: ADMIN_WEBAUTHN_POLICY.rpId,
        credential: {
          id: passkey.credentialId,
          publicKey: passkey.publicKey,
          counter: Number(passkey.counter),
          transports: (passkey.transports || []) as any,
        },
        requireUserVerification: true,
      });
    } catch (err: any) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_FAILED}] Cryptographic assertion error for Admin [${admin.id}]: ${err?.message}`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        `WebAuthn authentication failed: ${err?.message || 'Invalid assertion'}`,
      );
    }

    if (!verification.verified || !verification.authenticationInfo) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_FAILED}] Assertion unverified for Admin [${admin.id}]`,
      );
      throw new AdminWebAuthnAuthenticationFailedException(
        'WebAuthn assertion verification failed.',
      );
    }

    const { newCounter } = verification.authenticationInfo;

    // 6. Counter validation / Clone detection
    // If incoming counter is non-zero and less than or equal to stored counter, authenticator may be cloned
    if (passkey.counter > BigInt(0) && BigInt(newCounter) <= passkey.counter) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED}] Authenticator counter anomaly for Admin [${admin.id}] Passkey [${passkey.id}]. Stored: ${passkey.counter}, Incoming: ${newCounter}`,
      );

      // Record security incident in tamper-evident hash chain
      await this.anomalyDetectionService?.recordCounterAnomaly(
        admin.id,
        passkey.credentialId,
        passkey.counter,
        BigInt(newCounter),
      );

      // Immediately revoke the compromised passkey to prevent further exploitation
      await this.prisma.adminWebAuthnCredential.update({
        where: { id: passkey.id },
        data: {
          status: AdminCredentialStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: `Authenticator counter anomaly: Stored=${passkey.counter}, Incoming=${newCounter} (Possible cloned hardware token)`,
        },
      });

      throw new AdminWebAuthnAuthenticatorRejectedException(
        'Authenticator signature counter anomaly detected. Possible cloned device. Credential has been revoked.',
      );
    }

    // 7. Update state atomically
    await this.prisma.$transaction([
      this.prisma.adminWebAuthnCredential.update({
        where: { id: passkey.id },
        data: {
          counter: BigInt(newCounter),
          lastUsedAt: new Date(),
        },
      }),
      this.prisma.adminIdentity.update({
        where: { id: admin.id },
        data: {
          lastAuthenticatedAt: new Date(),
        },
      }),
    ]);

    // 8. Audit event
    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED}] Admin [${admin.id}] authenticated successfully via Passkey [${passkey.id}].`,
    );

    // 9. Return internal AuthenticatedAdminResult (ADMIN-005 issues session/JWT)
    return {
      authenticated: true,
      adminIdentityId: admin.id,
      identifier: admin.identifier,
      credentialId: passkey.id,
      authenticationTime: new Date(),
      assuranceLevel: 'AAL3',
    };
  }
}
