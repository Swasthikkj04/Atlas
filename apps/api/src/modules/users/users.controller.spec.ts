import { NotFoundException } from '@nestjs/common';
import { UserAccountStatus } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

describe('UsersController (AX-103)', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Swasthik K J',
    email: 'swasthik@example.com',
  };

  const mockProfileResponse: UserProfileResponseDto = {
    id: 'user-uuid-1',
    fullName: 'Swasthik Gowda',
    email: 'swasthik@example.com',
    avatarUrl: null,
    status: UserAccountStatus.ACTIVE,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-21T14:00:00.000Z'),
  };

  beforeEach(() => {
    usersService = {
      updateProfile: jest.fn().mockResolvedValue(mockProfileResponse),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    controller = new UsersController(usersService);
  });

  describe('PATCH /users/profile', () => {
    it('successfully updates authenticated user profile and returns updated representation', async () => {
      const req = { user: mockUser } as any;
      const dto: UpdateProfileDto = { fullName: 'Swasthik Gowda' };

      const result = await controller.updateProfile(req, dto);

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
      expect(result).toEqual(mockProfileResponse);
      expect(result.fullName).toBe('Swasthik Gowda');
      expect(result.status).toBe(UserAccountStatus.ACTIVE);
    });

    it('propagates NotFoundException if user account does not exist', async () => {
      usersService.updateProfile.mockRejectedValueOnce(
        new NotFoundException('User account not found'),
      );

      const req = { user: { id: 'non-existent' } } as any;
      const dto: UpdateProfileDto = { fullName: 'Nobody' };

      await expect(controller.updateProfile(req, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
