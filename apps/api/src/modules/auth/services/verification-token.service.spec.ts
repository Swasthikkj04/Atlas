import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { VerificationTokenService } from './verification-token.service';

describe('VerificationTokenService', () => {
  let service: VerificationTokenService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      verificationToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationTokenService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VerificationTokenService>(VerificationTokenService);
    prisma = module.get(PrismaService);
  });

  it('should generate 64-char hex raw token and SHA-256 hash', () => {
    const raw = service.generateRawToken();
    const hash = service.hashToken(raw);

    expect(raw).toHaveLength(64);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(raw);
  });

  it('should issue a new token and invalidate previous user tokens', async () => {
    (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});

    const rawToken = await service.issueVerificationToken('usr-123');

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usr-123' },
    });
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'usr-123',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
    expect(rawToken).toHaveLength(64);
  });

  it('should return null if token is expired or consumed', async () => {
    const expiredToken = {
      id: 'tok-1',
      userId: 'usr-123',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      createdAt: new Date(),
    };

    (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(expiredToken);

    const result = await service.findValidTokenByRaw('some_raw_token');
    expect(result).toBeNull();
  });
});
