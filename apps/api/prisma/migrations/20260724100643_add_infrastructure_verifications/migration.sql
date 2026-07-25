-- CreateTable
CREATE TABLE "infrastructure_verifications" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "changeDetected" BOOLEAN NOT NULL,
    "snapshotCreated" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infrastructure_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_verifications_jobId_key" ON "infrastructure_verifications"("jobId");

-- CreateIndex
CREATE INDEX "infrastructure_verifications_domainId_idx" ON "infrastructure_verifications"("domainId");

-- CreateIndex
CREATE INDEX "infrastructure_verifications_createdAt_idx" ON "infrastructure_verifications"("createdAt");

-- CreateIndex
CREATE INDEX "infrastructure_verifications_snapshotId_idx" ON "infrastructure_verifications"("snapshotId");

-- AddForeignKey
ALTER TABLE "infrastructure_verifications" ADD CONSTRAINT "infrastructure_verifications_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_verifications" ADD CONSTRAINT "infrastructure_verifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "understanding_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_verifications" ADD CONSTRAINT "infrastructure_verifications_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
