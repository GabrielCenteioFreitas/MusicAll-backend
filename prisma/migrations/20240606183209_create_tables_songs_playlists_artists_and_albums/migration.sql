/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "iTunesId" INTEGER NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iTunesViewUrl" TEXT NOT NULL,
    "portrait" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "durationInSeconds" INTEGER NOT NULL,
    "genre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs_playlists" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portrait" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "iTunesId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iTunesViewUrl" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "iTunesId" INTEGER NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iTunesViewUrl" TEXT NOT NULL,
    "portrait" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "genre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "songs_iTunesId_key" ON "songs"("iTunesId");

-- CreateIndex
CREATE UNIQUE INDEX "songs_iTunesViewUrl_key" ON "songs"("iTunesViewUrl");

-- CreateIndex
CREATE UNIQUE INDEX "songs_previewUrl_key" ON "songs"("previewUrl");

-- CreateIndex
CREATE UNIQUE INDEX "artists_iTunesId_key" ON "artists"("iTunesId");

-- CreateIndex
CREATE UNIQUE INDEX "artists_iTunesViewUrl_key" ON "artists"("iTunesViewUrl");

-- CreateIndex
CREATE UNIQUE INDEX "albums_iTunesId_key" ON "albums"("iTunesId");

-- CreateIndex
CREATE UNIQUE INDEX "albums_iTunesViewUrl_key" ON "albums"("iTunesViewUrl");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs_playlists" ADD CONSTRAINT "songs_playlists_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs_playlists" ADD CONSTRAINT "songs_playlists_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
