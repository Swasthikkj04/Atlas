import { Test, TestingModule } from '@nestjs/testing';
import { GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestSessionRepository } from './guest-session.repository';

describe('GuestSessionRepository', () => {
  let repository: GuestSessionRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockGuestSession = {
    id: 'gst-12345',
    sessionToken: 'token-abc-123',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: null,
    expiresAt: new Date(Date.now() + 86400000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      guestSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GuestSessionRepository>(GuestSessionRepository);
    prisma = module.get(PrismaService);
  });

  it('should create a guest session', async () => {
    (prisma.guestSession.create as jest.Mock).mockResolvedValue(mockGuestSession);

    const result = await repository.create({
      sessionToken: 'token-abc-123',
      expiresAt: mockGuestSession.expiresAt,
    });

    expect(prisma.guestSession.create).toHaveBeenCalledWith({
      data: {
        sessionToken: 'token-abc-123',
        expiresAt: mockGuestSession.expiresAt,
        understandingJobId: null,
        status: GuestSessionStatus.ACTIVE,
      },
    });
    expect(result).toEqual(mockGuestSession);
  });

  it('should find session by token', async () => {
    (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(mockGuestSession);

    const result = await repository.findByToken('token-abc-123');

    expect(prisma.guestSession.findUnique).toHaveBeenCalledWith({
      where: { sessionToken: 'token-abc-123' },
    });
    expect(result).toEqual(mockGuestSession);
  });

  it('should refresh session expiration', async () => {
    const newExpiresAt = new Date(Date.now() + 172800000);
    const updated = { ...mockGuestSession, expiresAt: newExpiresAt };
    (prisma.guestSession.update as jest.Mock).mockResolvedValue(updated);

    const result = await repository.refresh('gst-12345', newExpiresAt);

    expect(prisma.guestSession.update).toHaveBeenCalledWith({
      where: { id: 'gst-12345' },
      data: { expiresAt: newExpiresAt },
    });
    expect(result.expiresAt).toEqual(newExpiresAt);
  });

  it('should mark session completed', async () => {
    const completed = { ...mockGuestSession, status: GuestSessionStatus.COMPLETED };
    (prisma.guestSession.update as jest.Mock).mockResolvedValue(completed);

    const result = await repository.markCompleted('gst-12345');

    expect(result.status).toEqual(GuestSessionStatus.COMPLETED);
  });

  it('should delete expired sessions', async () => {
    (prisma.guestSession.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

    const deletedCount = await repository.deleteExpired();

    expect(deletedCount).toBe(5);
  });
});
