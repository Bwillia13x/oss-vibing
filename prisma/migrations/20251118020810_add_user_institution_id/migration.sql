-- AlterTable
ALTER TABLE "User" ADD COLUMN "institutionId" TEXT;

-- CreateIndex
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");
