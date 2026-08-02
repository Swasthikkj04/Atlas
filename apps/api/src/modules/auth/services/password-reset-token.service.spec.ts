import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PasswordResetTokenService } from './password-reset-token.service';

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      passwordResetToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PasswordResetTokenService>(PasswordResetTokenService);
    prisma = module.get(PrismaService);
  });

  it('should generate raw token and SHA-256 hash', () => {
    const raw = service.generateRawToken();
    const hash = service.hashToken(raw);

    expect(raw).toHaveLength(64);
    expect(hash).toHaveLength(64);
  });

  it('should issue a reset token and delete prior tokens', async () => {
    (prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({
      count: 1,
    });
    (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});

    const rawToken = await service.issueResetToken('usr-100');

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usr-100' },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(rawToken).toHaveLength(64);
  });

  it('should return null for expired or consumed reset tokens', async () => {
    const expiredToken = {
      id: 'tok-reset-1',
      userId: 'usr-100',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      createdAt: new Date(),
    };

    (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
      expiredToken,
    );

    const result = await service.findValidTokenByRaw('raw_token');
    expect(result).toBeNull();
  });
});
