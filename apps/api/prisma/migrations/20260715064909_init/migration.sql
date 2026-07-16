-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "FindingModule" AS ENUM ('HTML', 'SSL', 'DNS', 'HTTP', 'TECHNOLOGY', 'PERFORMANCE');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('CERTIFICATE', 'TLS', 'SECURITY_HEADER', 'REDIRECT', 'DNS_RECORD', 'TECHNOLOGY', 'PERFORMANCE', 'RESPONSE', 'GENERAL', 'CDN');

-- CreateEnum
CREATE TYPE "ChangeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'REMOVED', 'MODIFIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "understanding_jobs" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "triggerType" "TriggerType" NOT NULL,
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "understanding_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_snapshots" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infrastructure_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_findings" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "module" "FindingModule" NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "infrastructure_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_history" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "previousSnapshotId" TEXT NOT NULL,
    "currentSnapshotId" TEXT NOT NULL,
    "module" "FindingModule" NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "severity" "ChangeSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_briefs" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infrastructure_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "domains_userId_idx" ON "domains"("userId");

-- CreateIndex
CREATE INDEX "domains_domainName_idx" ON "domains"("domainName");

-- CreateIndex
CREATE UNIQUE INDEX "domains_userId_domainName_key" ON "domains"("userId", "domainName");

-- CreateIndex
CREATE INDEX "understanding_jobs_domainId_idx" ON "understanding_jobs"("domainId");

-- CreateIndex
CREATE INDEX "understanding_jobs_status_idx" ON "understanding_jobs"("status");

-- CreateIndex
CREATE INDEX "understanding_jobs_startedAt_idx" ON "understanding_jobs"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_snapshots_jobId_key" ON "infrastructure_snapshots"("jobId");

-- CreateIndex
CREATE INDEX "infrastructure_snapshots_domainId_idx" ON "infrastructure_snapshots"("domainId");

-- CreateIndex
CREATE INDEX "infrastructure_snapshots_createdAt_idx" ON "infrastructure_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "infrastructure_findings_snapshotId_idx" ON "infrastructure_findings"("snapshotId");

-- CreateIndex
CREATE INDEX "infrastructure_findings_module_idx" ON "infrastructure_findings"("module");

-- CreateIndex
CREATE INDEX "infrastructure_findings_category_idx" ON "infrastructure_findings"("category");

-- CreateIndex
CREATE INDEX "change_history_domainId_detectedAt_idx" ON "change_history"("domainId", "detectedAt");

-- CreateIndex
CREATE INDEX "change_history_severity_idx" ON "change_history"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_briefs_snapshotId_key" ON "infrastructure_briefs"("snapshotId");

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "understanding_jobs" ADD CONSTRAINT "understanding_jobs_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_snapshots" ADD CONSTRAINT "infrastructure_snapshots_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_snapshots" ADD CONSTRAINT "infrastructure_snapshots_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "understanding_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_findings" ADD CONSTRAINT "infrastructure_findings_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_previousSnapshotId_fkey" FOREIGN KEY ("previousSnapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_currentSnapshotId_fkey" FOREIGN KEY ("currentSnapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_briefs" ADD CONSTRAINT "infrastructure_briefs_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
