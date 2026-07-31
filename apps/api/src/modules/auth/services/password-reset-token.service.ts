import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PasswordResetTokenService {
  readonly tokenTtlHours = 1;

  constructor(private readonly prisma: PrismaService) {}

  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async issueResetToken(userId: string): Promise<string> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.tokenTtlHours * 60 * 60 * 1000);

    // Reissue Policy: Invalidate previous unused reset tokens for user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    await this.prisma.passwordResetToken.create({
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

    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) return null;
    if (token.consumedAt !== null) return null;
    if (now > token.expiresAt) return null;

    return token;
  }

  async markTokenConsumed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }
}
