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
});
