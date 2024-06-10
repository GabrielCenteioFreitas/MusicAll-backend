import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { prisma } from "../lib/prisma";

export async function playlistsRoutes(app: FastifyInstance) {
  app.get("/playlists", async () => {
    const playlists = await prisma.playlist.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
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
  
    return {
      playlists,
    }
  });

  app.get("/playlists/user", async (request) => {
    await request.jwtVerify();

    const playlists = await prisma.playlist.findMany({
      where: {
        userId: request.user.sub,
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

    playlists.sort((a, b) => {
      const isFixedA = a.isFixed && a.fixedAt;
      const isFixedB = b.isFixed && b.fixedAt;
    
      if (isFixedA && isFixedB) {
        const dateA = new Date(a.fixedAt!);
        const dateB = new Date(b.fixedAt!);
        return dateB.getTime() - dateA.getTime();
      } else if (!isFixedA && !isFixedB) {
        const dateA = new Date(a.createdAt!);
        const dateB = new Date(b.createdAt!);
        return dateB.getTime() - dateA.getTime();
      } else {
        return isFixedA ? -1 : 1;
      }
    });

    return {
      playlists: playlists.map((playlist) => {
        return {
          id: playlist.id,
          name: playlist.name,
          isFixed: playlist.isFixed,
          portrait: playlist.portrait,
          user: playlist.user,
          songs: playlist.songs,
        };
      })
    }
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

  app.delete("/playlists/:id", async (request, reply) => {
    await request.jwtVerify();

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params)

    const playlistToDelete = await prisma.playlist.findUnique({
      where: {
        id,
        userId: request.user.sub,
      }
    })

    if (!playlistToDelete) {
      reply.status(404).send('Not found or unauthorized user')
    }

    const deletedSongs = await prisma.songPlaylist.deleteMany({
      where: {
        playlist: {
          id,
          userId: request.user.sub,
        }
      }
    })

    const deletedPlaylist = await prisma.playlist.delete({
      where: {
        id,
        userId: request.user.sub,
      }
    });

    return {
      deletedPlaylist,
      deletedSongs
    };
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
                    iTunesId: true,
                    name: true,
                  }
                },
                album: {
                  select: {
                    id: true,
                    iTunesId: true,
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

  app.put("/playlists/:id", async (request) => {
    await request.jwtVerify();

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      portrait: z.string().optional(),
      isPublic: z.boolean().optional(),
      isFixed: z.boolean().optional(),
      fixedAt: z.string().nullable().optional(),
    })

    const { name, description, portrait, isPublic, isFixed, fixedAt } = bodySchema.parse(request.body);
    const fixedAtDate = fixedAt ? new Date(fixedAt) : fixedAt === null ? null : undefined

    const playlist = await prisma.playlist.update({
      where: {
        id,
        userId: request.user.sub,
      },
      data: {
        name,
        description,
        portrait,
        isPublic,
        isFixed,
        fixedAt: fixedAtDate,
      },
    });

    return {
      playlist
    }
  })

  app.post("/playlists/:id/songs", async (request) => {
    await request.jwtVerify();

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      newSong: z.object({
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
    });

    const { newSong } = bodySchema.parse(request.body);

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

    const addedSong = await prisma.songPlaylist.create({
      data: {
        song: {
          connect: { id: song.id },
        },
        playlist: {
          connect: { id },
        },
      },
    });

    return {
      addedSong
    };
  });

  app.delete("/playlists/:id/songs", async (request, reply) => {
    await request.jwtVerify();

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      songToRemove: z.object({
        id: z.string(),
      })
    })

    const { songToRemove } = bodySchema.parse(request.body);

    const songPlaylistEntry = await prisma.songPlaylist.findUnique({
      where: {
        id: songToRemove.id,
        playlistId: id,
        playlist: {
          userId: request.user.sub,
        },
      }
    });

    if (!songPlaylistEntry) {
      reply.status(404).send('Música não encontrada.')
    }

    const removedSong = await prisma.songPlaylist.delete({
      where: {
        id: songPlaylistEntry?.id
      }
    });

    return {
      removedSong
    };
  })
}
