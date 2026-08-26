import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MotionPreference,
  ThemePreference,
  UserAccountStatus,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import {
  MotionOption,
  ThemeOption,
  UpdatePreferencesDto,
} from './dto/update-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import { AccountOverviewResponseDto } from './dto/account-overview-response.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  private mapDbThemeToOption(
    theme: ThemePreference,
  ): 'system' | 'light' | 'dark' {
    switch (theme) {
      case ThemePreference.LIGHT:
        return 'light';
      case ThemePreference.DARK:
        return 'dark';
      case ThemePreference.SYSTEM:
      default:
        return 'system';
    }
  }

  private mapOptionToDbTheme(
    option?: ThemeOption,
  ): ThemePreference | undefined {
    if (!option) return undefined;
    switch (option) {
      case ThemeOption.LIGHT:
        return ThemePreference.LIGHT;
      case ThemeOption.DARK:
        return ThemePreference.DARK;
      case ThemeOption.SYSTEM:
      default:
        return ThemePreference.SYSTEM;
    }
  }

  private mapDbMotionToOption(
    motion: MotionPreference,
  ): 'system' | 'standard' | 'reduced' {
    switch (motion) {
      case MotionPreference.STANDARD:
        return 'standard';
      case MotionPreference.REDUCED:
        return 'reduced';
      case MotionPreference.SYSTEM:
      default:
        return 'system';
    }
  }

  private mapOptionToDbMotion(
    option?: MotionOption,
  ): MotionPreference | undefined {
    if (!option) return undefined;
    switch (option) {
      case MotionOption.STANDARD:
        return MotionPreference.STANDARD;
      case MotionOption.REDUCED:
        return MotionPreference.REDUCED;
      case MotionOption.SYSTEM:
      default:
        return MotionPreference.SYSTEM;
    }
  }

  async getAccountOverview(
    userId: string,
  ): Promise<AccountOverviewResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const activeSessionsCount = await this.prisma.userSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      hasPassword: Boolean(user.passwordHash && user.passwordHash.length > 0),
      connectedProviders: user.oauthAccounts.map((oa) => oa.provider),
      activeSessionsCount,
      createdAt: user.createdAt,
    };
  }

  async deactivateAccount(
    userId: string,
    dto: DeactivateAccountDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    if (user.status === UserAccountStatus.DEACTIVATED) {
      throw new BadRequestException('Account is already deactivated.');
    }

    const hasPassword = Boolean(
      user.passwordHash && user.passwordHash.length > 0,
    );

    if (hasPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to deactivate account.',
        );
      }
      const isPasswordValid = await this.passwordService.verify(
        user.passwordHash!,
        dto.currentPassword,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `[SecurityEvent:DEACTIVATION_REJECTED_INVALID_PASSWORD] userId=${userId}`,
        );
        throw new UnauthorizedException('Invalid current password.');
      }
    } else {
      if (dto.confirmText?.trim().toUpperCase() !== 'DEACTIVATE') {
        throw new BadRequestException(
          'Confirmation text must match DEACTIVATE to confirm account deactivation.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: UserAccountStatus.DEACTIVATED,
          tokenInvalidatedAt: new Date(),
        },
      });

      await tx.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(
      `[SecurityEvent:ACCOUNT_DEACTIVATED] userId=${userId} email=${user.email}`,
    );

    return {
      message:
        'Your Nebula account has been deactivated. All active sessions have been signed out.',
    };
  }

  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    if (dto.confirmText?.trim().toUpperCase() !== 'DELETE') {
      throw new BadRequestException(
        'Explicit confirmation required. Please type DELETE to confirm permanent account deletion.',
      );
    }

    const hasPassword = Boolean(
      user.passwordHash && user.passwordHash.length > 0,
    );

    if (hasPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to delete account.',
        );
      }
      const isPasswordValid = await this.passwordService.verify(
        user.passwordHash!,
        dto.currentPassword,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `[SecurityEvent:DELETION_REJECTED_INVALID_PASSWORD] userId=${userId}`,
        );
        throw new UnauthorizedException('Invalid current password.');
      }
    }

    // Execute atomic transactional deletion
    await this.prisma.$transaction(async (tx) => {
      // 1. Terminate all active sessions immediately
      await tx.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // 2. Cascade delete user and all owned resources
      await tx.user.delete({
        where: { id: userId },
      });
    });

    this.logger.log(
      `[SecurityEvent:ACCOUNT_DELETED] userId=${userId} email=${user.email}`,
    );

    return {
      message:
        'Your Nebula account and associated resources have been permanently deleted.',
    };
  }

  async getPreferences(userId: string): Promise<UserPreferencesResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    if (!user.preferences) {
      return {
        theme: 'system',
        motion: 'system',
        updatedAt: user.updatedAt || new Date(),
      };
    }

    return {
      theme: this.mapDbThemeToOption(user.preferences.theme),
      motion: this.mapDbMotionToOption(user.preferences.motion),
      updatedAt: user.preferences.updatedAt,
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const dbTheme = this.mapOptionToDbTheme(dto.theme);
    const dbMotion = this.mapOptionToDbMotion(dto.motion);

    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        theme: dbTheme ?? ThemePreference.SYSTEM,
        motion: dbMotion ?? MotionPreference.SYSTEM,
      },
      update: {
        ...(dbTheme !== undefined ? { theme: dbTheme } : {}),
        ...(dbMotion !== undefined ? { motion: dbMotion } : {}),
      },
    });

    this.logger.log(
      `[PreferencesUpdated] userId=${userId} theme=${preference.theme} motion=${preference.motion}`,
    );

    return {
      theme: this.mapDbThemeToOption(preference.theme),
      motion: this.mapDbMotionToOption(preference.motion),
      updatedAt: preference.updatedAt,
    };
  }
}
