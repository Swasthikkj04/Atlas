import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Authoritative Account Reactivation Token Engine (AX-112).
 *
 * Implements:
 * - 32-byte cryptographically secure random token generation
 * - SHA-256 one-way hashing for secure storage at rest
 * - 15-minute token TTL
 * - Automatic previous pending token revocation
 * - Single-use consumption verification
 */
@Injectable()
export class AccountReactivationTokenService {
  readonly tokenTtlMinutes = 15;

  constructor(private readonly prisma: PrismaService) {}

  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async issueReactivationToken(userId: string): Promise<string> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.tokenTtlMinutes * 60 * 1000);

    // Invalidate previous outstanding tokens for this user
    await this.prisma.accountReactivationToken.deleteMany({
      where: { userId },
    });

    await this.prisma.accountReactivationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  async findValidTokenByRaw(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const token = await this.prisma.accountReactivationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) return null;
    if (token.consumedAt !== null) return null;
    if (now > token.expiresAt) return null;

    return token;
  }

  async markTokenConsumed(id: string): Promise<void> {
    await this.prisma.accountReactivationToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.accountReactivationToken.deleteMany({
      where: { userId },
    });
  }
}
