/*
  Warnings:

  - You are about to drop the column `platform` on the `Game` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title,platformId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Made the column `platformId` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_platformId_fkey";

-- DropIndex
DROP INDEX "Game_title_platform_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "platform",
ALTER COLUMN "platformId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_title_platformId_key" ON "Game"("title", "platformId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
