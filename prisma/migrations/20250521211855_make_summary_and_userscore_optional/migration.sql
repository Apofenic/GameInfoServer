/*
  Warnings:

  - A unique constraint covering the columns `[title,platform]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "summary" TEXT,
ADD COLUMN     "userscore" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Game_title_platform_key" ON "Game"("title", "platform");
