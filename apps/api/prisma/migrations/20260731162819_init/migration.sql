/*
  Warnings:

  - You are about to drop the column `recommendations` on the `infrastructure_findings` table. All the data in the column will be lost.
  - Made the column `snapshotId` on table `infrastructure_verifications` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('HTTP_RESPONSE', 'HTTP_HEADERS', 'HTTP_BODY', 'REDIRECT_CHAIN', 'DNS_RESPONSE', 'TLS_CERTIFICATE', 'TECHNOLOGY_SIGNATURE', 'COLLECTOR_METADATA');

-- AlterEnum
ALTER TYPE "TriggerType" ADD VALUE 'EVENT';

-- DropForeignKey
ALTER TABLE "infrastructure_verifications" DROP CONSTRAINT "infrastructure_verifications_snapshotId_fkey";

-- DropIndex
DROP INDEX "infrastructure_verifications_createdAt_idx";

-- DropIndex
DROP INDEX "infrastructure_verifications_domainId_idx";

-- DropIndex
DROP INDEX "infrastructure_verifications_jobId_key";

-- AlterTable
ALTER TABLE "infrastructure_findings" DROP COLUMN "recommendations",
ADD COLUMN     "module" "FindingModule" NOT NULL DEFAULT 'HTTP';

-- AlterTable
ALTER TABLE "infrastructure_verifications" ALTER COLUMN "snapshotId" SET NOT NULL;

-- CreateTable
CREATE TABLE "raw_evidence" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "collectorName" TEXT NOT NULL,
    "collectorVersion" TEXT NOT NULL,
    "category" "EvidenceCategory" NOT NULL DEFAULT 'HTTP_RESPONSE',
    "payloadType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "compressedSizeBytes" INTEGER,
    "compressionType" TEXT DEFAULT 'NONE',
    "compressionVersion" TEXT DEFAULT '1.0',
    "hashSha256" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "requestMethod" TEXT,
    "responseStatus" INTEGER,
    "redirectIndex" INTEGER,
    "sourceEndpoint" TEXT,
    "targetEndpoint" TEXT,
    "protocolVersion" TEXT,
    "transportProtocol" TEXT,

    CONSTRAINT "raw_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_evidence_domainId_capturedAt_idx" ON "raw_evidence"("domainId", "capturedAt");

-- CreateIndex
CREATE INDEX "raw_evidence_snapshotId_idx" ON "raw_evidence"("snapshotId");

-- CreateIndex
CREATE INDEX "raw_evidence_collectorName_idx" ON "raw_evidence"("collectorName");

-- CreateIndex
CREATE INDEX "raw_evidence_category_idx" ON "raw_evidence"("category");

-- CreateIndex
CREATE INDEX "infrastructure_findings_severity_idx" ON "infrastructure_findings"("severity");

-- CreateIndex
CREATE INDEX "infrastructure_findings_module_idx" ON "infrastructure_findings"("module");

-- CreateIndex
CREATE INDEX "infrastructure_verifications_domainId_createdAt_idx" ON "infrastructure_verifications"("domainId", "createdAt");

-- CreateIndex
CREATE INDEX "infrastructure_verifications_jobId_idx" ON "infrastructure_verifications"("jobId");

-- AddForeignKey
ALTER TABLE "infrastructure_verifications" ADD CONSTRAINT "infrastructure_verifications_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_evidence" ADD CONSTRAINT "raw_evidence_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_evidence" ADD CONSTRAINT "raw_evidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "infrastructure_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
