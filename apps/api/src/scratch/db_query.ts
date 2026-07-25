import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE VERIFICATION ===');

  const rawEvidenceCount = await prisma.rawEvidence.count();
  const rawEvidences = await prisma.rawEvidence.findMany({
    take: 3,
    orderBy: { capturedAt: 'desc' },
  });

  const findingsCount = await prisma.infrastructureFinding.count();
  const findings = await prisma.infrastructureFinding.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  const snapshotsCount = await prisma.infrastructureSnapshot.count();
  const latestSnapshot = await prisma.infrastructureSnapshot.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { domain: true },
  });

  const changesCount = await prisma.changeHistory.count();
  const latestChange = await prisma.changeHistory.findFirst({
    orderBy: { detectedAt: 'desc' },
  });

  console.log(
    JSON.stringify(
      {
        rawEvidenceCount,
        sampleRawEvidence: rawEvidences,
        findingsCount,
        sampleFindings: findings,
        snapshotsCount,
        latestSnapshot,
        changesCount,
        latestChange,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
