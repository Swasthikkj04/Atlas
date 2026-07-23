/*
  Warnings:

  - Added the required column `highlights` to the `infrastructure_briefs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallHealth` to the `infrastructure_briefs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendations` to the `infrastructure_briefs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "infrastructure_briefs" ADD COLUMN     "highlights" JSONB NOT NULL,
ADD COLUMN     "overallHealth" TEXT NOT NULL,
ADD COLUMN     "recommendations" JSONB NOT NULL;
