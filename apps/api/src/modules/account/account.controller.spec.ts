import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ThemeOption, MotionOption } from './dto/update-preferences.dto';

describe('AccountController (AX-108 Account Lifecycle & Preferences)', () => {
  let controller: AccountController;
  let service: jest.Mocked<AccountService>;

  const mockOverviewResponse = {
    id: 'usr-123',
    email: 'user@example.com',
    fullName: 'Alex Developer',
    status: 'ACTIVE',
    hasPassword: true,
    connectedProviders: ['GOOGLE'],
    activeSessionsCount: 2,
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
  };

  const mockPreferencesResponse = {
    theme: 'dark' as const,
    motion: 'reduced' as const,
    updatedAt: new Date('2026-08-21T12:00:00.000Z'),
  };

  const mockRequest = {
    user: { id: 'usr-123' },
  } as any;

  beforeEach(async () => {
    const mockService = {
      getAccountOverview: jest.fn().mockResolvedValue(mockOverviewResponse),
      deactivateAccount: jest
        .fn()
        .mockResolvedValue({ message: 'Account deactivated.' }),
      deleteAccount: jest
        .fn()
        .mockResolvedValue({ message: 'Account deleted.' }),
      getPreferences: jest.fn().mockResolvedValue(mockPreferencesResponse),
      updatePreferences: jest.fn().mockResolvedValue(mockPreferencesResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: mockService }],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    service = module.get(AccountService);
  });

  it('should get account overview for authenticated user', async () => {
    const result = await controller.getAccountOverview(mockRequest);

    expect(service.getAccountOverview).toHaveBeenCalledWith('usr-123');
    expect(result).toEqual(mockOverviewResponse);
  });

  it('should deactivate account for authenticated user', async () => {
    const dto = { currentPassword: 'Password123!' };
    const result = await controller.deactivateAccount(mockRequest, dto);

    expect(service.deactivateAccount).toHaveBeenCalledWith('usr-123', dto);
    expect(result).toEqual({ message: 'Account deactivated.' });
  });

  it('should delete account for authenticated user', async () => {
    const dto = { currentPassword: 'Password123!', confirmText: 'DELETE' };
    const result = await controller.deleteAccount(mockRequest, dto);

    expect(service.deleteAccount).toHaveBeenCalledWith('usr-123', dto);
    expect(result).toEqual({ message: 'Account deleted.' });
  });

  it('should get preferences for authenticated user', async () => {
    const result = await controller.getPreferences(mockRequest);

    expect(service.getPreferences).toHaveBeenCalledWith('usr-123');
    expect(result).toEqual(mockPreferencesResponse);
  });

  it('should update preferences for authenticated user', async () => {
    const dto = {
      theme: ThemeOption.DARK,
      motion: MotionOption.REDUCED,
    };

    const result = await controller.updatePreferences(mockRequest, dto);

    expect(service.updatePreferences).toHaveBeenCalledWith('usr-123', dto);
    expect(result).toEqual(mockPreferencesResponse);
  });
});
