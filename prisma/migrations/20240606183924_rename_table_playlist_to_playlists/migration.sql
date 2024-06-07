/*
  Warnings:

  - You are about to drop the `Playlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "songs_playlists" DROP CONSTRAINT "songs_playlists_playlistId_fkey";

-- DropTable
DROP TABLE "Playlist";

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portrait" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "songs_playlists" ADD CONSTRAINT "songs_playlists_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
