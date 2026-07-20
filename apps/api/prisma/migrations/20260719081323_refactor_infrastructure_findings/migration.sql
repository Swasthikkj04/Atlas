/*
  Warnings:

  - You are about to drop the column `key` on the `infrastructure_findings` table. All the data in the column will be lost.
  - You are about to drop the column `module` on the `infrastructure_findings` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `infrastructure_findings` table. All the data in the column will be lost.
  - Added the required column `description` to the `infrastructure_findings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendations` to the `infrastructure_findings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruleId` to the `infrastructure_findings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `infrastructure_findings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `infrastructure_findings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- DropIndex
DROP INDEX "infrastructure_findings_category_idx";

-- DropIndex
DROP INDEX "infrastructure_findings_module_idx";

-- AlterTable
ALTER TABLE "infrastructure_findings" DROP COLUMN "key",
DROP COLUMN "module",
DROP COLUMN "value",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "recommendations" JSONB NOT NULL,
ADD COLUMN     "ruleId" TEXT NOT NULL,
ADD COLUMN     "severity" "Severity" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
