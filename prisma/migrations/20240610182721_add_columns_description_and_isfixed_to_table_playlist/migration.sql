-- AlterTable
ALTER TABLE "playlists" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fixedAt" TIMESTAMP(3),
ADD COLUMN     "isFixed" BOOLEAN NOT NULL DEFAULT false;
