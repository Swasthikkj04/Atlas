import { Test, TestingModule } from '@nestjs/testing';
import { GuestSessionStatus } from '@prisma/client';
import { GuestRetentionPolicy } from './guest-retention.policy';

describe('GuestRetentionPolicy', () => {
  let policy: GuestRetentionPolicy;

  const mockSession = {
    id: 'gst-100',
    sessionToken: 'gst_abc',
    status: GuestSessionStatus.EXPIRED,
    understandingJobId: 'job-1',
    expiresAt: new Date(Date.now() - 1000), // Past expiration
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestRetentionPolicy],
    }).compile();

    policy = module.get<GuestRetentionPolicy>(GuestRetentionPolicy);
  });

  it('should detect expired date', () => {
    expect(policy.isExpired(new Date(Date.now() - 5000))).toBe(true);
    expect(policy.isExpired(new Date(Date.now() + 5000))).toBe(false);
  });

  it('should mark expired non-converted session eligible for cleanup', () => {
    expect(policy.isEligibleForCleanup(mockSession)).toBe(true);
  });

  it('should NEVER mark CONVERTED session eligible for cleanup', () => {
    const convertedSession = {
      ...mockSession,
      status: GuestSessionStatus.CONVERTED,
      expiresAt: new Date(Date.now() - 10000),
    };
    expect(policy.isEligibleForCleanup(convertedSession)).toBe(false);
  });
});
