import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class VerificationTokenService {
  readonly tokenTtlHours = 24;

  constructor(private readonly prisma: PrismaService) {}

  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async issueVerificationToken(userId: string): Promise<string> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + this.tokenTtlHours * 60 * 60 * 1000,
    );

    // Invalidate existing active verification tokens for user
    await this.prisma.verificationToken.deleteMany({
      where: { userId },
    });

    await this.prisma.verificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  async findValidTokenByRaw(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const token = await this.prisma.verificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) return null;
    if (token.consumedAt !== null) return null;
    if (now > token.expiresAt) return null;

    return token;
  }

  async markTokenConsumed(id: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
