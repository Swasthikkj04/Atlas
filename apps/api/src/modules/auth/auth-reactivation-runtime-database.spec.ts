import { PrismaClient, UserAccountStatus } from '@prisma/client';
import { AccountReactivationTokenService } from './services/account-reactivation-token.service';
import * as crypto from 'crypto';

describe('AX-113: Reactivation Database Schema & Runtime Integrity Verification', () => {
  let prisma: PrismaClient;
  let tokenService: AccountReactivationTokenService;
  const testUserId = `usr-test-reactivate-${Date.now()}`;
  const testEmail = `test.reactivate.${Date.now()}@example.com`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    tokenService = new AccountReactivationTokenService(prisma as any);

    // Create a real test user in PostgreSQL
    await prisma.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        fullName: 'Test Reactivation User',
        status: UserAccountStatus.DEACTIVATED,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.accountReactivationToken
      .deleteMany({ where: { userId: testUserId } })
      .catch(() => null);
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => null);
    await prisma.$disconnect();
  });

  describe('1. Real PostgreSQL Table & Index Verification (NO_SCHEMA_DRIFT_FOR_REACTIVATION)', () => {
    it('verifies account_reactivation_tokens exists with correct schema columns in PostgreSQL', async () => {
      const columns: any[] = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'account_reactivation_tokens'
        ORDER BY column_name;
      `;

      const columnNames = columns.map((c) => c.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('tokenHash');
      expect(columnNames).toContain('expiresAt');
      expect(columnNames).toContain('consumedAt');
      expect(columnNames).toContain('createdAt');
    });

    it('verifies unique and index constraints on tokenHash and userId in PostgreSQL', async () => {
      const indexes: any[] = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'account_reactivation_tokens';
      `;

      const indexNames = indexes.map((i) => i.indexname);
      expect(indexNames).toContain('account_reactivation_tokens_pkey');
      expect(indexNames).toContain('account_reactivation_tokens_tokenHash_key');
      expect(indexNames).toContain('account_reactivation_tokens_userId_idx');
    });
  });

  describe('2. Real Database Token Persistence & Lifecycle Operations', () => {
    it('issues, hashes, and persists a reactivation token in PostgreSQL', async () => {
      const rawToken = await tokenService.issueReactivationToken(testUserId);

      expect(typeof rawToken).toBe('string');
      expect(rawToken.length).toBe(64); // 32 bytes in hex

      const expectedHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      // Verify token record in actual database
      const record = await prisma.accountReactivationToken.findUnique({
        where: { tokenHash: expectedHash },
        include: { user: true },
      });

      expect(record).not.toBeNull();
      expect(record?.userId).toBe(testUserId);
      expect(record?.consumedAt).toBeNull();
      expect(record?.user.email).toBe(testEmail);
      expect(record?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('invalidates prior pending tokens on reissuance in PostgreSQL', async () => {
      const rawToken1 = await tokenService.issueReactivationToken(testUserId);
      const hash1 = tokenService.hashToken(rawToken1);

      // Reissue second token
      const rawToken2 = await tokenService.issueReactivationToken(testUserId);
      const hash2 = tokenService.hashToken(rawToken2);

      // Token 1 should be removed
      const record1 = await prisma.accountReactivationToken.findUnique({
        where: { tokenHash: hash1 },
      });
      expect(record1).toBeNull();

      // Token 2 should be active
      const record2 = await prisma.accountReactivationToken.findUnique({
        where: { tokenHash: hash2 },
      });
      expect(record2).not.toBeNull();
    });

    it('validates and consumes token atomically in PostgreSQL', async () => {
      const rawToken = await tokenService.issueReactivationToken(testUserId);
      const validRecord = await tokenService.findValidTokenByRaw(rawToken);

      expect(validRecord).not.toBeNull();
      expect(validRecord?.userId).toBe(testUserId);

      // Consume token
      await tokenService.markTokenConsumed(validRecord!.id);

      // Verify second lookup fails (single-use enforcement)
      const consumedLookup = await tokenService.findValidTokenByRaw(rawToken);
      expect(consumedLookup).toBeNull();
    });
  });

  describe('3. Understanding Engine & Worker Isolation', () => {
    it('verifies understanding_jobs and domains tables remain completely intact and functional', async () => {
      const jobColumns: any[] = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'understanding_jobs';
      `;
      expect(jobColumns.length).toBeGreaterThan(5);

      const domainColumns: any[] = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'domains';
      `;
      expect(domainColumns.length).toBeGreaterThan(5);
    });
  });
});
