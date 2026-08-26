import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        {
          provide: GoogleAuthService,
          useValue: {
            resolveAndAuthenticateGoogleUser: jest.fn(),
          },
        },
        {
          provide: GitHubAuthService,
          useValue: {
            resolveAndAuthenticateGitHubUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              if (key === 'NODE_ENV') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return RegisterResponseDto', async () => {
      const registerDto = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const expectedResponse = {
        message: 'User registered successfully',
        user: {
          id: 'user-uuid-1',
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: new Date(),
        },
      };

      authService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('changePassword (AX-104)', () => {
    it('should call authService.changePassword with authenticated userId and credentials', async () => {
      const req = { user: { id: 'user-uuid-123' } } as any;
      const dto = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewSecurePassword456!',
      };

      const expectedResponse = { message: 'Password changed successfully.' };
      authService.changePassword.mockResolvedValue(expectedResponse);

      const result = await controller.changePassword(req, dto);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-uuid-123',
        dto.currentPassword,
        dto.newPassword,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
