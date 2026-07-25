import {
  Body,
  Controller,
  Get,
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

import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { RateLimit } from '../../infrastructure/rate-limiting/rate-limit.decorator';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @RateLimit({ limit: 5, windowSeconds: 3600, name: 'auth_register' })
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user account in Atlas with full name, email, and password. Returns a success confirmation message along with sanitized user profile details. Does not automatically log in or issue JWT tokens.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error (e.g. invalid email format, short password).',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email is already registered.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded.',
    type: ApiErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'auth_login' })
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Authenticates an existing user credentials (email & password) and returns JWT access and refresh tokens along with user details.',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid email or password.',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded.',
    type: ApiErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the profile of the currently authenticated user based on the JWT bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT bearer token.',
    type: ApiErrorResponseDto,
  })
  getProfile(@Req() request: Request) {
    return request.user;
  }
}