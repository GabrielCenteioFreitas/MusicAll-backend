import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { prisma } from "../lib/prisma";

export async function playlistsRoutes(app: FastifyInstance) {
  app.get("/playlists", async (request) => {
    let playlists;

    try {
      await request.jwtVerify()

      playlists = await prisma.playlist.findMany({
        where: {
          OR: [
            { isPublic: true },
            { isPublic: false, userId: request.user.sub },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
          songs: {
            select: {
              song: {
                select: {
                  portrait: true,
                  iTunesId: true,
                }
              }
            }
          }
        },
      });
    } catch {
      playlists = await prisma.playlist.findMany({
        where: {
          isPublic: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
          songs: {
            select: {
              song: {
                select: {
                  portrait: true
                }
              }
            }
          }
        },
      });
    }
  
    return playlists.map((playlist) => {
      return {
        id: playlist.id,
        name: playlist.name,
        portrait: playlist.portrait,
        user: playlist.user,
        songs: playlist.songs,
      };
    });
  });

  app.get("/playlists/user", async (request) => {
    await request.jwtVerify();

    const playlists = await prisma.playlist.findMany({
      where: {
        userId: request.user.sub,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
        songs: {
          select: {
            song: {
              select: {
                portrait: true,
                iTunesId: true,
              }
            }
          }
        }
      },
    });

    return playlists.map((playlist) => {
      return {
        id: playlist.id,
        name: playlist.name,
        portrait: playlist.portrait,
        user: playlist.user,
        songs: playlist.songs,
      };
    });
  });

  app.get("/playlists/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params)

    let playlist = await prisma.playlist.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            name: true,
            id: true,
            avatarUrl: true,
          }
        },
        songs: {
          include: {
            song: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true,
                  }
                },
                album: {
                  select: {
                    id: true,
                    name: true,
                  }
                },              
              }
            },
          },
        },
      },
    })

    if (playlist?.isPublic) {
      return playlist
    }

    await request.jwtVerify()

    if (playlist?.userId === request.user.sub) {
      return playlist
    }

    return reply.status(403).send('Acesso não permitido');
  });

  app.post("/playlists", async (request) => {
    await request.jwtVerify();

    const bodySchema = z.object({
      userId: z.string(),
      name: z.string(),
      isPublic: z.boolean(),
    });

    const { name, userId, isPublic } = bodySchema.parse(request.body);

    const playlist = await prisma.playlist.create({
      data: {
        name,
        isPublic,
        user: {
          connect: { id: userId },
        },
      },
    });

    return playlist;
  });

  app.put("/playlists/:id", async (request) => {
    await request.jwtVerify();

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      name: z.string(),
      portrait: z.string().nullish(),
      isPublic: z.boolean(),
      newSong: z
        .object({
          name: z.string(),
          portrait: z.string().url(),
          iTunesId: z.number(),
          iTunesViewUrl: z.string().url(),
          artist: z.object({
            name: z.string(),
            iTunesId: z.number(),
            iTunesViewUrl: z.string().url(),
            genre: z.string(),
          }),
          album: z.object({
            name: z.string(),
            portrait: z.string().url(),
            iTunesId: z.number(),
            iTunesViewUrl: z.string().url(),
            releaseDate: z.string(),
            genre: z.string(),
          }),
          previewUrl: z.string().url(),
          releaseDate: z.string(),
          durationInSeconds: z.number(),
          genre: z.string(),
        })
        .optional(),
    });

    const { name, portrait, isPublic, newSong } = bodySchema.parse(request.body);
    let playlist = {};

    if (newSong) {
      let artist = await prisma.artist.findUnique({
        where: {
          iTunesId: newSong.artist.iTunesId,
        },
      });

      if (!artist) {
        artist = await prisma.artist.create({
          data: {
            name: newSong.artist.name,
            iTunesId: newSong.artist.iTunesId,
            iTunesViewUrl: newSong.artist.iTunesViewUrl,
            genre: newSong.artist.genre,
          },
        });
      }

      let album = await prisma.album.findUnique({
        where: {
          iTunesId: newSong.album.iTunesId,
        },
      });

      if (!album) {
        album = await prisma.album.create({
          data: {
            name: newSong.album.name,
            portrait: newSong.album.portrait,
            iTunesId: newSong.album.iTunesId,
            iTunesViewUrl: newSong.album.iTunesViewUrl,
            genre: newSong.album.genre,
            releaseDate: newSong.album.releaseDate,
            artist: {
              connect: { id: artist.id },
            },
          },
        });
      }

      let song = await prisma.song.findUnique({
        where: {
          iTunesId: newSong.iTunesId,
        },
      });

      if (!song) {
        song = await prisma.song.create({
          data: {
            name: newSong.name,
            portrait: newSong.portrait,
            iTunesId: newSong.iTunesId,
            iTunesViewUrl: newSong.iTunesViewUrl,
            artist: {
              connect: { id: artist.id },
            },
            album: {
              connect: { id: album.id },
            },
            previewUrl: newSong.previewUrl,
            releaseDate: newSong.releaseDate,
            durationInSeconds: newSong.durationInSeconds,
            genre: newSong.genre,
          },
        });
      }

      await prisma.songPlaylist.create({
        data: {
          song: {
            connect: { id: song.id },
          },
          playlist: {
            connect: { id },
          },
        },
      });
    }

    playlist = await prisma.playlist.update({
      where: {
        id,
        userId: request.user.sub,
      },
      data: {
        name,
        portrait,
        isPublic,
      },
    });

    return {
      playlist,
      newSong,
    };
  });
}
