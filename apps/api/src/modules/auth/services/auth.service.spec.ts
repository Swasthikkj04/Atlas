import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from '../../users/users.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashed_password_abc',
    createdAt: new Date('2026-07-25T12:00:00.000Z'),
    updatedAt: new Date('2026-07-25T12:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should register a new user successfully and return sanitized user details without sensitive fields', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed_password_abc');
      usersService.create.mockResolvedValue(mockUser);

      const registerDto = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await authService.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.hash).toHaveBeenCalledWith('Password123!');
      expect(usersService.create).toHaveBeenCalledWith({
        fullName: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_abc',
      });

      expect(result).toEqual({
        message: 'User registered successfully',
        user: {
          id: 'user-uuid-123',
          fullName: 'Test User',
          email: 'test@example.com',
          createdAt: mockUser.createdAt,
        },
      });

      // Verify no sensitive fields are present
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if user email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const registerDto = {
        fullName: 'Duplicate User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('mock_token');

      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock_token',
        refreshToken: 'mock_token',
        user: {
          id: mockUser.id,
          fullName: mockUser.fullName,
          email: mockUser.email,
        },
      });
    });
  });
});
