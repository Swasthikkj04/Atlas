-- CreateTable
CREATE TABLE IF NOT EXISTS "account_reactivation_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_reactivation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "account_reactivation_tokens_tokenHash_key" ON "account_reactivation_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_reactivation_tokens_userId_idx" ON "account_reactivation_tokens"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_reactivation_tokens_tokenHash_idx" ON "account_reactivation_tokens"("tokenHash");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'account_reactivation_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "account_reactivation_tokens" ADD CONSTRAINT "account_reactivation_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
