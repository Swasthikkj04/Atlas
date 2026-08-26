import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { AccountService } from './account.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import { AccountOverviewResponseDto } from './dto/account-overview-response.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Account & Lifecycle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get authoritative account overview and lifecycle status',
    description:
      'Retrieves identity attributes, account status, security posture, and active session count for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account overview retrieved successfully.',
    type: AccountOverviewResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token.',
    type: ApiErrorResponseDto,
  })
  async getAccountOverview(
    @Req() req: AuthenticatedRequest,
  ): Promise<AccountOverviewResponseDto> {
    return this.accountService.getAccountOverview(req.user.id);
  }

  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate authenticated account',
    description:
      'Deactivates the authenticated user account, revoking all active sessions while preserving historical infrastructure data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully and all sessions revoked.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing password or invalid confirmation text.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid current password.',
    type: ApiErrorResponseDto,
  })
  async deactivateAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeactivateAccountDto,
  ): Promise<{ message: string }> {
    return this.accountService.deactivateAccount(req.user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete authenticated account and owned resources',
    description:
      'Permanently deletes the authenticated user account, terminating all active sessions and cascades to user-owned resources.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted permanently.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing password or invalid confirmation text.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid current password.',
    type: ApiErrorResponseDto,
  })
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    return this.accountService.deleteAccount(req.user.id, dto);
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get authenticated user appearance & motion preferences',
    description:
      'Retrieves the authoritative persisted theme and motion preferences for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully.',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired authentication token.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User account not found.',
    type: ApiErrorResponseDto,
  })
  async getPreferences(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserPreferencesResponseDto> {
    return this.accountService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update authenticated user appearance & motion preferences',
    description:
      'Updates the authoritative persisted theme or motion preference for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User preferences updated successfully.',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error on preference values.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired authentication token.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User account not found.',
    type: ApiErrorResponseDto,
  })
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.accountService.updatePreferences(req.user.id, dto);
  }
}
