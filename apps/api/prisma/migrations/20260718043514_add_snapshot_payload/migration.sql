/*
  Warnings:

  - Added the required column `payload` to the `infrastructure_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "infrastructure_snapshots" ADD COLUMN     "payload" JSONB NOT NULL;
