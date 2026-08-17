import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { UserSessionResponseDto } from './dto/session-response.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { parseUserAgent } from './utils/user-agent.parser';
import {
  clearAuthCookies,
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
    const clientIp = req.ip || req.socket.remoteAddress;
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
    const clientIp = req.ip || req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const { accessToken, refreshToken } =
      await this.googleAuthService.resolveAndAuthenticateGoogleUser(
        googleProfile,
        deviceMeta,
      );

    setAuthCookies(res, accessToken, refreshToken);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
    const clientIp = req.ip || req.socket.remoteAddress;
    const deviceMeta = parseUserAgent(userAgent, clientIp);

    const { accessToken, refreshToken } =
      await this.githubAuthService.resolveAndAuthenticateGitHubUser(
        githubProfile,
        deviceMeta,
      );

    setAuthCookies(res, accessToken, refreshToken);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
    const token =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.cookies?.nebula_refresh_token ||
      req.cookies?.refresh_token ||
      dto?.refreshToken;

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
    const token =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.cookies?.nebula_refresh_token ||
      req.cookies?.refresh_token ||
      dto?.refreshToken;

    const result = await this.authService.logout(token);
    clearAuthCookies(res);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout of all active user sessions',
    description:
      'Revokes all active sessions for current user and clears HTTP-Only cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out of all sessions successfully.',
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const user = req.user as { id: string };
    const result = await this.authService.logoutAll(user.id);
    clearAuthCookies(res);

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
    return this.authService.getSessions(user.id);
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
  async verifyEmail(
    @Body() verifyDto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyEmailResponseDto> {
    const userAgent = req.headers['user-agent'];
    const clientIp = req.ip || req.socket.remoteAddress;
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
