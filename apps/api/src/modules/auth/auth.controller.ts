import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Optional,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthProvider } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuthCallbackExceptionFilter } from './filters/oauth-callback-exception.filter';

import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { RateLimit } from '../../infrastructure/rate-limiting/rate-limit.decorator';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailResponseDto } from './dto/verify-email-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { UserSessionResponseDto } from './dto/session-response.dto';
import { ConnectedProvidersResponseDto } from './dto/connected-providers-response.dto';
import { RequestReactivationDto } from './dto/request-reactivation.dto';
import { ConfirmReactivationDto } from './dto/confirm-reactivation.dto';
import { ReactivationResponseDto } from './dto/reactivation-response.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { parseUserAgent } from './utils/user-agent.parser';
import {
  clearAuthCookies,
  extractRefreshToken,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
} from './utils/auth-cookie.util';
import { setCsrfCookie } from './utils/csrf.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly githubAuthService: GitHubAuthService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  @RateLimit({ limit: 5, windowSeconds: 3600, name: 'auth_register' })
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user account in Atlas in PENDING_VERIFICATION status and dispatches a cryptographically secure email verification link.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Verification email dispatched.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email is already registered.',
    type: ApiErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'auth_login' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Authenticates user credentials, creates stateful session, sets HTTP-Only security cookies, and returns payload.',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Invalid credentials or email verification pending.',
    type: ApiErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const result = await this.authService.login(loginDto, deviceMeta);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get CSRF double-submit token',
    description:
      'Issues a readable CSRF token cookie for frontend clients to attach as X-CSRF-Token on state-changing requests.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token cookie issued successfully.',
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response): {
    csrfToken: string;
  } {
    const token = setCsrfCookie(res);
    return { csrfToken: token };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'Redirects user to Google OAuth 2.0 consent page for external identity authentication.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent page.',
  })
  async googleAuth() {
    // Passport redirects to Google
  }

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'auth_google_callback' })
  @Get('google/callback')
  @UseFilters(OAuthCallbackExceptionFilter)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth authentication callback',
    description:
      'Processes Google identity profile, resolves Nebula user, creates stateful session, sets HTTP-Only cookies, and redirects to /auth/callback.',
  })
  @ApiResponse({
    status: 302,
    description: 'Sets HTTP-only session cookies and redirects frontend.',
  })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleProfile = req.user as any;
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const { accessToken, refreshToken } =
      await this.googleAuthService.resolveAndAuthenticateGoogleUser(
        googleProfile,
        deviceMeta,
      );

    setAuthCookies(res, accessToken, refreshToken);

    const isProduction =
      this.configService?.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';
    const frontendUrl =
      this.configService?.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      (isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173');
    return res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Initiate GitHub OAuth login',
    description:
      'Redirects user to GitHub OAuth consent page requesting read:user and user:email scopes.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub OAuth consent page.',
  })
  async githubAuth() {
    // Passport redirects to GitHub
  }

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'auth_github_callback' })
  @Get('github/callback')
  @UseFilters(OAuthCallbackExceptionFilter)
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth authentication callback',
    description:
      'Processes GitHub identity profile, verifies primary email, resolves Nebula user, creates stateful session, sets HTTP-Only cookies, and redirects to /auth/callback.',
  })
  @ApiResponse({
    status: 302,
    description: 'Sets HTTP-only session cookies and redirects frontend.',
  })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const githubProfile = req.user as any;
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const { accessToken, refreshToken } =
      await this.githubAuthService.resolveAndAuthenticateGitHubUser(
        githubProfile,
        deviceMeta,
      );

    setAuthCookies(res, accessToken, refreshToken);

    const isProduction =
      this.configService?.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';
    const frontendUrl =
      this.configService?.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      (isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173');
    return res.redirect(`${frontendUrl}/auth/callback`);
  }

  @RateLimit({ limit: 30, windowSeconds: 3600, name: 'auth_refresh' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue new access token',
    description:
      'Reads refresh token cookie or body, rotates session, sets new HTTP-Only cookies, and returns updated tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens rotated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid, expired, or revoked refresh token.',
    type: ApiErrorResponseDto,
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const token = extractRefreshToken(req) || dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const result = await this.authService.refresh(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout current session',
    description:
      'Revokes the specified stateful refresh token session and clears HTTP-Only cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current session logged out successfully.',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: LogoutDto,
  ): Promise<{ message: string }> {
    const token = extractRefreshToken(req) || dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const result = await this.authService.logout(token);
    clearAuthCookies(res);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 10, windowSeconds: 3600, name: 'auth_change_password' })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change authenticated user password',
    description:
      'Verifies the existing password with Argon2 and updates it to the new password complying with security policy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Validation failure or new password equals current password.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Incorrect current password or invalid authentication.',
    type: ApiErrorResponseDto,
  })
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = req.user as { id: string };
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout of all other active user sessions',
    description:
      'Revokes all other active sessions for current user while preserving the current session.',
  })
  @ApiResponse({
    status: 200,
    description: 'All other active sessions have been signed out.',
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const user = req.user as { id: string };
    const rawToken = extractRefreshToken(req);
    const result = await this.authService.logoutAll(user.id, rawToken);
    if (!rawToken) {
      clearAuthCookies(res);
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List active user sessions',
    description:
      'Retrieves all active, non-revoked device sessions for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User sessions retrieved successfully.',
    type: [UserSessionResponseDto],
  })
  async getSessions(@Req() req: Request): Promise<UserSessionResponseDto[]> {
    const user = req.user as { id: string };
    const rawToken = extractRefreshToken(req);
    return this.authService.getSessions(user.id, rawToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke specific user session',
    description:
      'Revokes a specific device session by session ID for the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Session ID to revoke',
    example: 'ses-550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Session not found or does not belong to user.',
    type: ApiErrorResponseDto,
  })
  async revokeSession(
    @Req() req: Request,
    @Param('id') sessionId: string,
  ): Promise<{ message: string }> {
    const user = req.user as { id: string };
    return this.authService.revokeSession(user.id, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('providers')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List connected authentication providers',
    description:
      'Retrieves connection status, safe account labels, and disconnectability for all supported OAuth providers for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connected providers retrieved successfully.',
    type: ConnectedProvidersResponseDto,
  })
  async getProviders(
    @Req() req: Request,
  ): Promise<ConnectedProvidersResponseDto> {
    const user = req.user as { id: string };
    return this.authService.getConnectedProviders(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('providers/:provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disconnect external authentication provider',
    description:
      'Safely unlinks an OAuth provider from the user account after verifying that alternative authentication methods remain active.',
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'github'],
    description: 'OAuth provider name (google or github)',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider disconnected successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot disconnect final authentication method.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Provider is not connected to user account.',
    type: ApiErrorResponseDto,
  })
  async disconnectProvider(
    @Req() req: Request,
    @Param('provider') providerStr: string,
  ): Promise<{ message: string }> {
    const user = req.user as { id: string };
    const normalized = providerStr.toUpperCase();
    if (
      normalized !== OAuthProvider.GOOGLE &&
      normalized !== OAuthProvider.GITHUB
    ) {
      throw new BadRequestException('Unsupported OAuth provider.');
    }
    return this.authService.disconnectProvider(user.id, normalized);
  }

  @RateLimit({ limit: 10, windowSeconds: 3600, name: 'auth_verify_email' })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email address and establish authenticated session',
    description:
      'Validates a raw single-use verification token, marks email verified, transitions account status to ACTIVE, creates an authenticated session, and sets HTTP-Only security cookies.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Email verified successfully. Authenticated session established.',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Token is invalid or has expired.',
    type: ApiErrorResponseDto,
  })
  @RateLimit({
    limit: 15,
    windowSeconds: 900,
    name: 'auth_verify_email',
  })
  async verifyEmail(
    @Body() verifyDto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyEmailResponseDto> {
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const result = await this.authService.verifyEmail(
      verifyDto.token,
      deviceMeta,
    );
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  @RateLimit({
    limit: 3,
    windowSeconds: 3600,
    name: 'auth_resend_verification',
  })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link',
    description:
      'Invalidates previous tokens and issues a new email verification token if the target account is pending verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification request processed.',
  })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  @RateLimit({ limit: 3, windowSeconds: 3600, name: 'auth_forgot_password' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email',
    description:
      'Generates a secure single-use password reset link if an ACTIVE account exists for the specified email address.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Generic success response returned regardless of account existence to prevent email enumeration.',
    schema: {
      example: {
        message:
          'If an account exists for this email, password reset instructions have been sent.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error (invalid email format).',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description:
      'Too Many Requests - Rate limit exceeded (3 requests per hour).',
    type: ApiErrorResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @RateLimit({ limit: 5, windowSeconds: 3600, name: 'auth_reset_password' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset account password',
    description:
      'Validates a raw password reset token, updates account password using Argon2, invalidates prior recovery tokens, revokes all active JWT sessions, and requires re-authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully. All active sessions revoked.',
    schema: {
      example: {
        message:
          'Password has been reset successfully. All active sessions have been revoked. Please log in with your new password.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Password reset token is invalid or has expired.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Account is not active or token has been revoked.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description:
      'Too Many Requests - Rate limit exceeded (5 requests per hour).',
    type: ApiErrorResponseDto,
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.password,
    );
    clearAuthCookies(res);
    return result;
  }

  @RateLimit({
    limit: 5,
    windowSeconds: 3600,
    name: 'auth_reactivate_request',
  })
  @Post('reactivate/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request account reactivation link',
    description:
      'Dispatches a single-use 15-minute reactivation token to the registered email address if the account is in DEACTIVATED status. Generic response returned to prevent enumeration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reactivation request processed.',
    schema: {
      example: {
        message:
          'If an eligible deactivated account is associated with this email, a secure reactivation link has been sent.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email format.',
    type: ApiErrorResponseDto,
  })
  async requestReactivation(
    @Body() dto: RequestReactivationDto,
  ): Promise<{ message: string }> {
    return this.authService.requestReactivation(dto.email);
  }

  @RateLimit({
    limit: 10,
    windowSeconds: 900,
    name: 'auth_reactivate_confirm',
  })
  @Post('reactivate/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm account reactivation and establish authenticated session',
    description:
      'Validates a raw single-use reactivation token, transitions account status from DEACTIVATED to ACTIVE in an atomic transaction, invalidates previous sessions, establishes a new stateful session, and sets HTTP-Only security cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account reactivated successfully.',
    type: ReactivationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Token is invalid, expired, or consumed.',
    type: ApiErrorResponseDto,
  })
  async confirmReactivation(
    @Body() dto: ConfirmReactivationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReactivationResponseDto> {
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const result = await this.authService.confirmReactivation(
      dto.token,
      deviceMeta,
    );
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves profile details of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  getProfile(@Req() request: Request) {
    return request.user;
  }
}
