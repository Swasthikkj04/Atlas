-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'ATTEMPTED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "email_delivery_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_delivery_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_delivery_records_idempotencyKey_key" ON "email_delivery_records"("idempotencyKey");

-- CreateIndex
CREATE INDEX "email_delivery_records_userId_idx" ON "email_delivery_records"("userId");

-- CreateIndex
CREATE INDEX "email_delivery_records_emailType_idx" ON "email_delivery_records"("emailType");

-- CreateIndex
CREATE INDEX "email_delivery_records_status_idx" ON "email_delivery_records"("status");

-- AddForeignKey
ALTER TABLE "email_delivery_records" ADD CONSTRAINT "email_delivery_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
