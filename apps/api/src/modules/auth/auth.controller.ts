import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { RateLimit } from '../../infrastructure/rate-limiting/rate-limit.decorator';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @RateLimit({ limit: 5, windowSeconds: 3600, name: 'auth_register' })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<void> {
    await this.authService.register(registerDto);
  }

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'auth_login' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() request: Request) {
    return request.user;
  }
}