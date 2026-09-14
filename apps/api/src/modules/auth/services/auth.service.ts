import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider, UserAccountStatus } from '@prisma/client';

import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { VerifyEmailResponseDto } from '../dto/verify-email-response.dto';
import { UserSessionResponseDto } from '../dto/session-response.dto';
import { ConnectedProvidersResponseDto } from '../dto/connected-providers-response.dto';
import { ReactivationResponseDto } from '../dto/reactivation-response.dto';

import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { PasswordService } from './password.service';
import { VerificationTokenService } from './verification-token.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { AccountReactivationTokenService } from './account-reactivation-token.service';
import { UserSessionService } from './user-session.service';
import { OAuthAccountService } from './oauth-account.service';
import { DeviceMetadata } from '../utils/user-agent.parser';
import { PasswordPolicy } from '../validators/password-policy.validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly tokenService: VerificationTokenService,
    private readonly resetTokenService: PasswordResetTokenService,
    private readonly sessionService: UserSessionService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    @Optional()
    private readonly reactivationTokenService?: AccountReactivationTokenService,
    @Optional() private readonly oauthAccountService?: OAuthAccountService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const passwordValidation = PasswordPolicy.validate(registerDto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        passwordValidation.error ||
          'Password does not meet security requirements.',
      );
    }

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
      .sendVerificationEmail(user.email, rawToken, user.fullName)
      .catch(() => null);

    // 4. Dispatch Personal Welcome Email (AUTH-EMAIL-001 / Non-blocking duplicate-protected)
    void this.emailService
      ?.sendWelcomeEmail?.(user.id, user.email, user.fullName)
      ?.catch(() => null);

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

  /**
   * AUTH-011: Canonical Session & Token Establishment Logic
   * Creates a persisted database user session and signs an access JWT.
   * Shared by password login, email verification, Google OAuth, and GitHub OAuth.
   */
  async establishSession(
    user: { id: string; email: string },
    deviceMeta?: DeviceMetadata,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // AUTH-003 Stateful Session Platform: Create DB Session & Issue Hashed Refresh Token
    const { session, rawRefreshToken } =
      await this.sessionService.createSession(user.id, deviceMeta);

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      sessionId: session?.id,
      iat,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
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

    // AX-112 Lifecycle Guard: Deactivated Account
    if (user.status === UserAccountStatus.DEACTIVATED) {
      throw new UnauthorizedException(
        'Your Nebula account is currently deactivated. Please request a reactivation link to restore access.',
      );
    }

    // AX-108 Lifecycle Guard: Deleted Account
    if (user.status === UserAccountStatus.DELETED) {
      throw new UnauthorizedException(
        'This account has been permanently deleted.',
      );
    }

    const session = await this.establishSession(user, deviceMeta);

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
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
    const { user, session, newRawRefreshToken } =
      await this.sessionService.rotateSession(rawRefreshToken);

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      sessionId: session?.id,
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

  async logoutAll(
    userId: string,
    currentRawRefreshToken?: string,
  ): Promise<{ message: string }> {
    if (currentRawRefreshToken) {
      const currentHash = this.sessionService.hashRefreshToken(
        currentRawRefreshToken,
      );
      await this.sessionService.revokeAllOtherSessions(userId, currentHash);
      return { message: 'All other active sessions have been signed out.' };
    }

    await this.sessionService.revokeAllUserSessions(userId);
    return { message: 'Logged out of all sessions successfully.' };
  }

  async getSessions(
    userId: string,
    currentRawRefreshToken?: string,
  ): Promise<UserSessionResponseDto[]> {
    const currentHash = currentRawRefreshToken
      ? this.sessionService.hashRefreshToken(currentRawRefreshToken)
      : undefined;

    const sessions = await this.sessionService.getUserSessions(userId);
    return sessions.map((s, index) => ({
      id: s.id,
      deviceName: s.deviceName || 'Unknown Device',
      deviceType: s.deviceType || 'Desktop',
      browser: s.browser || 'Unknown',
      operatingSystem: s.operatingSystem || 'Unknown',
      ipAddress: s.ipAddress || '127.0.0.1',
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : index === 0,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    await this.sessionService.revokeSessionById(userId, sessionId);
    return { message: 'Session revoked successfully.' };
  }

  async getConnectedProviders(
    userId: string,
  ): Promise<ConnectedProvidersResponseDto> {
    if (!this.oauthAccountService) {
      return { providers: [] };
    }
    return this.oauthAccountService.getProvidersForUser(userId);
  }

  async disconnectProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<{ message: string }> {
    if (!this.oauthAccountService) {
      throw new BadRequestException('OAuth account service not available.');
    }
    return this.oauthAccountService.disconnectProvider(userId, provider);
  }

  async verifyEmail(
    rawToken: string,
    deviceMeta?: DeviceMetadata,
  ): Promise<VerifyEmailResponseDto> {
    if (!rawToken || typeof rawToken !== 'string') {
      this.logger.warn(
        `[SecurityEvent:VERIFICATION_TOKEN_REJECTED] reason=malformed_token`,
      );
      throw new BadRequestException(
        'This verification link is no longer valid.',
      );
    }

    const tokenHash = this.tokenService.hashToken(rawToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const token = await tx.verificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!token) {
        this.logger.warn(
          `[SecurityEvent:VERIFICATION_TOKEN_REJECTED] reason=unknown_token`,
        );
        throw new BadRequestException(
          'This verification link is no longer valid.',
        );
      }

      if (token.consumedAt !== null) {
        if (token.user.status === UserAccountStatus.ACTIVE) {
          this.logger.log(
            `[SecurityEvent:EMAIL_ALREADY_VERIFIED] userId=${token.userId}`,
          );
          return {
            alreadyVerified: true,
            user: token.user,
          };
        }
        this.logger.warn(
          `[SecurityEvent:VERIFICATION_TOKEN_REJECTED] reason=consumed_token userId=${token.userId}`,
        );
        throw new BadRequestException(
          'This verification link is no longer valid.',
        );
      }

      if (now > token.expiresAt) {
        this.logger.warn(
          `[SecurityEvent:VERIFICATION_TOKEN_EXPIRED] tokenId=${token.id} userId=${token.userId}`,
        );
        throw new BadRequestException('This verification link has expired.');
      }

      // Mark token consumed
      await tx.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: now },
      });

      // Activate Account & Mark Email Verified
      const updatedUser = await tx.user.update({
        where: { id: token.userId },
        data: {
          status: UserAccountStatus.ACTIVE,
          emailVerifiedAt: now,
        },
      });

      this.logger.log(
        `[SecurityEvent:VERIFICATION_TOKEN_CONSUMED] tokenId=${token.id} userId=${token.userId}`,
      );
      this.logger.log(
        `[SecurityEvent:EMAIL_VERIFICATION_SUCCESS] userId=${token.userId}`,
      );

      return {
        alreadyVerified: false,
        user: updatedUser,
      };
    });

    if (result.alreadyVerified) {
      return {
        message: 'Your email is already verified.',
        status: UserAccountStatus.ACTIVE,
        alreadyVerified: true,
        user: {
          id: result.user.id,
          fullName: result.user.fullName,
          email: result.user.email,
        },
      };
    }

    // AUTH-004: Immediately Establish Authenticated Session for freshly activated account
    const session = await this.establishSession(result.user, deviceMeta);

    return {
      message: 'Email verified successfully. Your account is now active.',
      status: UserAccountStatus.ACTIVE,
      alreadyVerified: false,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
      },
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    if (!email || typeof email !== 'string') {
      return {
        message:
          'If a pending account exists for this email, a new verification link has been sent.',
      };
    }

    const user = await this.usersService.findByEmail(email);

    // Privacy Guard: Prevent email enumeration, return consistent message
    if (user && user.status === UserAccountStatus.PENDING_VERIFICATION) {
      this.logger.log(
        `[SecurityEvent:VERIFICATION_RESEND_REQUESTED] userId=${user.id}`,
      );
      const rawToken = await this.tokenService.issueVerificationToken(user.id);
      this.logger.log(
        `[SecurityEvent:VERIFICATION_TOKEN_ISSUED] userId=${user.id}`,
      );
      void this.emailService
        .sendVerificationEmail(user.email, rawToken, user.fullName)
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
        .sendPasswordResetEmail(user.email, rawToken, user.fullName)
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

    const passwordValidation = PasswordPolicy.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        passwordValidation.error ||
          'Password does not meet security requirements.',
      );
    }

    // 1. Hash New Password with Argon2
    const passwordHash = await this.passwordService.hash(newPassword);

    // 2. Update Password Hash and Force Instant Session Revocation
    const now = new Date();
    await this.prisma.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        tokenInvalidatedAt: now,
      },
    });

    // Revoke all stateful DB user sessions
    await this.sessionService.revokeAllUserSessions(token.userId);

    // 3. Mark Token Consumed & Invalidate Reset Tokens for User
    await this.resetTokenService.markTokenConsumed(token.id);
    await this.resetTokenService.invalidateUserTokens(token.userId);

    // 4. Structured Security Log
    this.logger.log(
      `[SecurityEvent:PASSWORD_RESET_SUCCESS] userId=${token.userId}`,
    );

    // 5. Send Security Confirmation Notice (Non-blocking)
    void this.emailService
      .sendPasswordResetConfirmationEmail(token.user.email, token.user.fullName)
      .catch(() => null);

    return {
      message:
        'Password has been reset successfully. All active sessions have been revoked. Please log in with your new password.',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // 1. Verify current password
    const isCurrentPasswordValid = await this.passwordService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // 2. Validate that new password is not identical to current password
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password.',
      );
    }

    // 3. Enforce canonical PasswordPolicy
    const passwordValidation = PasswordPolicy.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        passwordValidation.error ||
          'New password does not meet security requirements.',
      );
    }

    // 4. Hash new password with Argon2
    const passwordHash = await this.passwordService.hash(newPassword);

    // 5. Update user password in database
    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: now,
      },
    });

    // 6. Structured Security Log
    this.logger.log(`[SecurityEvent:PASSWORD_CHANGED] userId=${userId}`);

    return {
      message: 'Password changed successfully.',
    };
  }

  /**
   * AX-112: Account Reactivation Request Engine (Anti-Enumeration)
   *
   * Dispatches a single-use 15-minute reactivation token to the user email
   * if and only if the account is in DEACTIVATED status. Returns a generic
   * message to prevent user enumeration.
   */
  async requestReactivation(email: string): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'If an eligible deactivated account is associated with this email, a secure reactivation link has been sent.',
    };

    if (!email || typeof email !== 'string') return genericResponse;

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (
      !user ||
      user.status !== UserAccountStatus.DEACTIVATED ||
      !this.reactivationTokenService
    ) {
      return genericResponse;
    }

    const rawToken = await this.reactivationTokenService.issueReactivationToken(
      user.id,
    );

    this.logger.log(
      `[SecurityEvent:ACCOUNT_REACTIVATION_REQUESTED] userId=${user.id} email=${user.email}`,
    );

    await this.emailService
      .sendAccountReactivationEmail(user.email, rawToken, user.fullName)
      .catch(() => null);

    return genericResponse;
  }

  /**
   * AX-112: Account Reactivation Confirmation & Atomic State Restoration
   *
   * Validates single-use reactivation token, executes an atomic transaction
   * transitioning status from DEACTIVATED to ACTIVE, advances tokenInvalidatedAt,
   * consumes the token, and creates a fresh authenticated session.
   */
  async confirmReactivation(
    rawToken: string,
    deviceMeta: DeviceMetadata,
  ): Promise<ReactivationResponseDto> {
    if (!this.reactivationTokenService) {
      throw new BadRequestException('Reactivation service unavailable.');
    }

    const tokenRecord =
      await this.reactivationTokenService.findValidTokenByRaw(rawToken);

    if (!tokenRecord || !tokenRecord.user) {
      this.logger.warn(
        `[SecurityEvent:ACCOUNT_REACTIVATION_TOKEN_REJECTED] reason=invalid_or_expired`,
      );
      throw new BadRequestException(
        'Invalid or expired reactivation token. Please request a new reactivation link.',
      );
    }

    const user = tokenRecord.user;

    if (user.status !== UserAccountStatus.DEACTIVATED) {
      this.logger.warn(
        `[SecurityEvent:ACCOUNT_REACTIVATION_TOKEN_REJECTED] userId=${user.id} status=${user.status}`,
      );
      throw new BadRequestException('Account is not in a deactivated state.');
    }

    // Transactional Atomic Reactivation (AX-112)
    const reactivatedUser = await this.prisma.$transaction(async (tx) => {
      // Mark token consumed
      await tx.accountReactivationToken.update({
        where: { id: tokenRecord.id },
        data: { consumedAt: new Date() },
      });

      // Reactivate user and advance tokenInvalidatedAt to ensure old sessions remain invalid
      return tx.user.update({
        where: { id: user.id },
        data: {
          status: UserAccountStatus.ACTIVE,
          tokenInvalidatedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    });

    this.logger.log(
      `[SecurityEvent:ACCOUNT_REACTIVATED] userId=${reactivatedUser.id} email=${reactivatedUser.email}`,
    );

    // Create fresh authenticated session for reactivated account
    const session = await this.establishSession(reactivatedUser, deviceMeta);

    return {
      message: 'Your account has been successfully reactivated.',
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: reactivatedUser.id,
        fullName: reactivatedUser.fullName,
        email: reactivatedUser.email,
        createdAt: reactivatedUser.createdAt,
      },
    };
  }
}
