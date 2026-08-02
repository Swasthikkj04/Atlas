import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';

import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { VerifyEmailResponseDto } from '../dto/verify-email-response.dto';
import { UserSessionResponseDto } from '../dto/session-response.dto';

import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { PasswordService } from './password.service';
import { VerificationTokenService } from './verification-token.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { UserSessionService } from './user-session.service';
import { DeviceMetadata } from '../utils/user-agent.parser';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly tokenService: VerificationTokenService,
    private readonly resetTokenService: PasswordResetTokenService,
    private readonly sessionService: UserSessionService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await this.passwordService.hash(registerDto.password);

    // 1. Create User in PENDING_VERIFICATION status
    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash,
    });

    // 2. Issue Cryptographically Hashed Verification Token
    const rawToken = await this.tokenService.issueVerificationToken(user.id);

    // 3. Dispatch Verification Email (Non-blocking abstraction)
    void this.emailService
      .sendVerificationEmail(user.email, rawToken)
      .catch(() => null);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    deviceMeta: DeviceMetadata,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await this.passwordService.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // AUTH-001 Security Rule: Enforce Email Verification Status
    if (user.status === UserAccountStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Email verification required. Please verify your email before logging in.',
      );
    }

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      iat,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // AUTH-003 Stateful Session Platform: Create DB Session & Issue Hashed Refresh Token
    const { rawRefreshToken } = await this.sessionService.createSession(
      user.id,
      deviceMeta,
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // AUTH-003 Refresh Token Rotation: Validate, Rotate & Issue New Tokens
    const { user, newRawRefreshToken } =
      await this.sessionService.rotateSession(rawRefreshToken);

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      iat,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<{ message: string }> {
    if (rawRefreshToken) {
      await this.sessionService.revokeSessionByRawToken(rawRefreshToken);
    }
    return { message: 'Logged out successfully.' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.sessionService.revokeAllUserSessions(userId);
    return { message: 'Logged out of all sessions successfully.' };
  }

  async getSessions(userId: string): Promise<UserSessionResponseDto[]> {
    const sessions = await this.sessionService.getUserSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName || 'Unknown Device',
      deviceType: s.deviceType || 'Desktop',
      browser: s.browser || 'Unknown',
      operatingSystem: s.operatingSystem || 'Unknown',
      ipAddress: s.ipAddress || '127.0.0.1',
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    await this.sessionService.revokeSessionById(userId, sessionId);
    return { message: 'Session revoked successfully.' };
  }

  async verifyEmail(rawToken: string): Promise<VerifyEmailResponseDto> {
    const token = await this.tokenService.findValidTokenByRaw(rawToken);

    if (!token) {
      throw new BadRequestException(
        'Verification link is invalid or has expired.',
      );
    }

    // Activate Account & Mark Email Verified
    await this.prisma.user.update({
      where: { id: token.userId },
      data: {
        status: UserAccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    // Mark Token Consumed
    await this.tokenService.markTokenConsumed(token.id);

    return {
      message: 'Email verified successfully. Your account is now active.',
      status: UserAccountStatus.ACTIVE,
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Privacy Guard: Prevent email enumeration, return consistent message
    if (user && user.status === UserAccountStatus.PENDING_VERIFICATION) {
      const rawToken = await this.tokenService.issueVerificationToken(user.id);
      void this.emailService
        .sendVerificationEmail(user.email, rawToken)
        .catch(() => null);
    }

    return {
      message:
        'If a pending account exists for this email, a new verification link has been sent.',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // AUTH-002 Security Rule: Issue password reset ONLY for ACTIVE accounts
    if (user && user.status === UserAccountStatus.ACTIVE) {
      const rawToken = await this.resetTokenService.issueResetToken(user.id);
      void this.emailService
        .sendPasswordResetEmail(user.email, rawToken)
        .catch(() => null);
    }

    // Generic Response Privacy Guard: Never expose account existence
    return {
      message:
        'If an account exists for this email, password reset instructions have been sent.',
    };
  }

  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const token = await this.resetTokenService.findValidTokenByRaw(rawToken);

    if (!token || token.user.status !== UserAccountStatus.ACTIVE) {
      throw new BadRequestException(
        'Password reset link is invalid or has expired.',
      );
    }

    // 1. Hash New Password with Argon2
    const passwordHash = await this.passwordService.hash(newPassword);

    // 2. Update Password Hash and Force Instant Session Revocation
    await this.prisma.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        tokenInvalidatedAt: new Date(),
      },
    });

    // Revoke all stateful DB user sessions
    await this.sessionService.revokeAllUserSessions(token.userId);

    // 3. Mark Token Consumed & Invalidate Reset Tokens for User
    await this.resetTokenService.markTokenConsumed(token.id);
    await this.resetTokenService.invalidateUserTokens(token.userId);

    // 4. Send Security Confirmation Notice (Non-blocking)
    void this.emailService
      .sendPasswordResetConfirmationEmail(token.user.email)
      .catch(() => null);

    return {
      message:
        'Password has been reset successfully. All active sessions have been revoked. Please log in with your new password.',
    };
  }
}
