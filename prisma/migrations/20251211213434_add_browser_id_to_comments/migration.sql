-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "browserId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_browserId_idx" ON "Comment"("browserId");
