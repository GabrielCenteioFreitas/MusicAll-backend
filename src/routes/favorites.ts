import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function favoritesRoutes(app: FastifyInstance) {
  app.get('/favorites', async (request) => {
    await request.jwtVerify()

    const user = await prisma.user.findUnique({
      where: {
        id: request.user.sub,
      },
      include: {
        favoriteSongs: {
          include: {
            song: {
              include: {
                artist: true,
              },
            },
          }
        },
        favoriteAlbums: {
          include: {
            album: {
              include: {
                artist: true,
              },
            },
          }
        },
        favoriteArtists: {
          include: {
            artist: true,
          }
        },
      }
    })
      
    return {
      favoriteSongs: user?.favoriteSongs,
      favoriteArtists: user?.favoriteArtists,
      favoriteAlbums: user?.favoriteAlbums,
    }
  })

  app.post('/favorites/song', async (request) => {
    await request.jwtVerify()

    const bodySchema = z.object({
      songToBeFavorited: z.object({
        name: z.string(),
        portrait: z.string().url(),
        iTunesId: z.number(),
        iTunesViewUrl: z.string().url(),
        previewUrl: z.string().url(),
        releaseDate: z.string(),
        durationInSeconds: z.number(),
        genre: z.string(),
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
      })
    });

    const { songToBeFavorited } = bodySchema.parse(request.body);

    let artist = await prisma.artist.findUnique({
      where: {
        iTunesId: songToBeFavorited.artist.iTunesId,
      },
    });

    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          name: songToBeFavorited.artist.name,
          iTunesId: songToBeFavorited.artist.iTunesId,
          iTunesViewUrl: songToBeFavorited.artist.iTunesViewUrl,
          genre: songToBeFavorited.artist.genre,
        },
      });
    }

    let album = await prisma.album.findUnique({
      where: {
        iTunesId: songToBeFavorited.album.iTunesId,
      },
    });

    if (!album) {
      album = await prisma.album.create({
        data: {
          name: songToBeFavorited.album.name,
          portrait: songToBeFavorited.album.portrait,
          iTunesId: songToBeFavorited.album.iTunesId,
          iTunesViewUrl: songToBeFavorited.album.iTunesViewUrl,
          genre: songToBeFavorited.album.genre,
          releaseDate: songToBeFavorited.album.releaseDate,
          artist: {
            connect: { id: artist.id },
          },
        },
      });
    }

    let song = await prisma.song.findUnique({
      where: {
        iTunesId: songToBeFavorited.iTunesId,
      },
    });

    if (song) {
      song = await prisma.song.update({
        where: {
          id: song.id
        },
        data: {
          name: songToBeFavorited.name,
          portrait: songToBeFavorited.portrait,
          iTunesId: songToBeFavorited.iTunesId,
          iTunesViewUrl: songToBeFavorited.iTunesViewUrl,
          artist: {
            connect: { id: artist.id },
          },
          album: {
            connect: { id: album.id },
          },
          previewUrl: songToBeFavorited.previewUrl,
          releaseDate: songToBeFavorited.releaseDate,
          durationInSeconds: songToBeFavorited.durationInSeconds,
          genre: songToBeFavorited.genre,
        },
      });
    } else {
      song = await prisma.song.create({
        data: {
          name: songToBeFavorited.name,
          portrait: songToBeFavorited.portrait,
          iTunesId: songToBeFavorited.iTunesId,
          iTunesViewUrl: songToBeFavorited.iTunesViewUrl,
          artist: {
            connect: { id: artist.id },
          },
          album: {
            connect: { id: album.id },
          },
          previewUrl: songToBeFavorited.previewUrl,
          releaseDate: songToBeFavorited.releaseDate,
          durationInSeconds: songToBeFavorited.durationInSeconds,
          genre: songToBeFavorited.genre,
        },
      });
    }

    const favoritedSong = await prisma.userFavoriteSongs.create({
      data: {
        song: {
          connect: { id: song.id }
        },
        user: {
          connect: { id: request.user.sub }
        },
      }
    })

    return {
      favoritedSong
    }
  })

  app.post('/favorites/album', async (request) => {
    await request.jwtVerify()

    const bodySchema = z.object({
      albumToBeFavorited: z.object({
        name: z.string(),
        portrait: z.string().url(),
        iTunesId: z.number(),
        iTunesViewUrl: z.string().url(),
        releaseDate: z.string(),
        genre: z.string(),
        artist: z.object({
          name: z.string(),
          iTunesId: z.number(),
          iTunesViewUrl: z.string().url(),
          genre: z.string(),
        }),
        songs: z.array(z.object({
          name: z.string(),
          portrait: z.string().url(),
          iTunesId: z.number(),
          iTunesViewUrl: z.string().url(),
          previewUrl: z.string().url(),
          releaseDate: z.string(),
          durationInSeconds: z.number(),
          genre: z.string(),
        }))
      })
    });

    const { albumToBeFavorited } = bodySchema.parse(request.body);

    let artist = await prisma.artist.findUnique({
      where: {
        iTunesId: albumToBeFavorited.artist.iTunesId,
      },
    });

    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          name: albumToBeFavorited.artist.name,
          iTunesId: albumToBeFavorited.artist.iTunesId,
          iTunesViewUrl: albumToBeFavorited.artist.iTunesViewUrl,
          genre: albumToBeFavorited.artist.genre,
        },
      });
    }

    let album = await prisma.album.findUnique({
      where: {
        iTunesId: albumToBeFavorited.iTunesId,
      },
    });

    if (album) {
      album = await prisma.album.update({
        where: {
          id: album.id
        },
        data: {
          name: albumToBeFavorited.name,
          portrait: albumToBeFavorited.portrait,
          iTunesId: albumToBeFavorited.iTunesId,
          iTunesViewUrl: albumToBeFavorited.iTunesViewUrl,
          genre: albumToBeFavorited.genre,
          releaseDate: albumToBeFavorited.releaseDate,
          artist: {
            connect: { id: artist.id },
          },
        },
      });
    } else {
      album = await prisma.album.create({
        data: {
          name: albumToBeFavorited.name,
          portrait: albumToBeFavorited.portrait,
          iTunesId: albumToBeFavorited.iTunesId,
          iTunesViewUrl: albumToBeFavorited.iTunesViewUrl,
          genre: albumToBeFavorited.genre,
          releaseDate: albumToBeFavorited.releaseDate,
          artist: {
            connect: { id: artist.id },
          },
        },
      });
    }

    for (const currentSong of albumToBeFavorited.songs) {
      let song = await prisma.song.findUnique({
        where: {
          iTunesId: currentSong.iTunesId,
        },
      });

  
      if (song) {
        song = await prisma.song.update({
          where: {
            id: song.id
          },
          data: {
            name: currentSong.name,
            portrait: currentSong.portrait,
            iTunesId: currentSong.iTunesId,
            iTunesViewUrl: currentSong.iTunesViewUrl,
            previewUrl: currentSong.previewUrl,
            releaseDate: currentSong.releaseDate,
            durationInSeconds: currentSong.durationInSeconds,
            genre: currentSong.genre,
            artist: {
              connect: { id: artist.id },
            },
            album: {
              connect: { id: album.id },
            },
          },
        });
      } else {
        song = await prisma.song.create({
          data: {
            name: currentSong.name,
            portrait: currentSong.portrait,
            iTunesId: currentSong.iTunesId,
            iTunesViewUrl: currentSong.iTunesViewUrl,
            previewUrl: currentSong.previewUrl,
            releaseDate: currentSong.releaseDate,
            durationInSeconds: currentSong.durationInSeconds,
            genre: currentSong.genre,
            artist: {
              connect: { id: artist.id },
            },
            album: {
              connect: { id: album.id },
            },
          },
        });
      }
    }

    const favoritedAlbum = await prisma.userFavoriteAlbums.create({
      data: {
        album: {
          connect: { id: album.id }
        },
        user: {
          connect: { id: request.user.sub }
        },
      }
    })

    return {
      favoritedAlbum
    }
  })

  app.post('/favorites/artist', async (request) => {
    await request.jwtVerify()

    const bodySchema = z.object({
      artistToBeFavorited: z.object({
        name: z.string(),
        iTunesId: z.number(),
        iTunesViewUrl: z.string().url(),
        genre: z.string(),
        albums: z.array(z.object({
          name: z.string(),
          portrait: z.string().url(),
          iTunesId: z.number(),
          iTunesViewUrl: z.string().url(),
          releaseDate: z.string(),
          genre: z.string(),
        })),
        songs: z.array(z.object({
          name: z.string(),
          portrait: z.string().url(),
          iTunesId: z.number(),
          iTunesViewUrl: z.string().url(),
          previewUrl: z.string().url(),
          releaseDate: z.string(),
          durationInSeconds: z.number(),
          genre: z.string(),
          album: z.object({
            name: z.string(),
            portrait: z.string().url(),
            iTunesId: z.number(),
            iTunesViewUrl: z.string().url(),
            releaseDate: z.string(),
            genre: z.string(),
          }),
        }))
      })
    });

    const { artistToBeFavorited } = bodySchema.parse(request.body);

    let artist = await prisma.artist.findUnique({
      where: {
        iTunesId: artistToBeFavorited.iTunesId,
      },
    });

    if (artist) {
      artist = await prisma.artist.update({
        where: {
          iTunesId: artistToBeFavorited.iTunesId
        },
        data: {
          name: artistToBeFavorited.name,
          iTunesId: artistToBeFavorited.iTunesId,
          iTunesViewUrl: artistToBeFavorited.iTunesViewUrl,
          genre: artistToBeFavorited.genre,
        },
      });
    } else {
      artist = await prisma.artist.create({
        data: {
          name: artistToBeFavorited.name,
          iTunesId: artistToBeFavorited.iTunesId,
          iTunesViewUrl: artistToBeFavorited.iTunesViewUrl,
          genre: artistToBeFavorited.genre,
        },
      });
    }

    for (const currentAlbum of artistToBeFavorited.albums) {
      let album = await prisma.album.findUnique({
        where: {
          iTunesId: currentAlbum.iTunesId,
        },
      });
  
      if (album) {
        album = await prisma.album.update({
          where: {
            id: album.id
          },
          data: {
            name: currentAlbum.name,
            portrait: currentAlbum.portrait,
            iTunesId: currentAlbum.iTunesId,
            iTunesViewUrl: currentAlbum.iTunesViewUrl,
            genre: currentAlbum.genre,
            releaseDate: currentAlbum.releaseDate,
            artist: {
              connect: { id: artist.id },
            },
          },
        });
      } else {
        album = await prisma.album.create({
          data: {
            name: currentAlbum.name,
            portrait: currentAlbum.portrait,
            iTunesId: currentAlbum.iTunesId,
            iTunesViewUrl: currentAlbum.iTunesViewUrl,
            genre: currentAlbum.genre,
            releaseDate: currentAlbum.releaseDate,
            artist: {
              connect: { id: artist.id },
            },
          },
        });
      }
    }

    for (const currentSong of artistToBeFavorited.songs) {
      let song = await prisma.song.findUnique({
        where: {
          iTunesId: currentSong.iTunesId,
        },
      });

      let album = await prisma.album.findUnique({
        where: {
          iTunesId: currentSong.album.iTunesId
        }
      });

      if (!album) {
        album = await prisma.album.create({
          data: {
            name: currentSong.album.name,
            portrait: currentSong.album.portrait,
            iTunesId: currentSong.album.iTunesId,
            iTunesViewUrl: currentSong.album.iTunesViewUrl,
            genre: currentSong.album.genre,
            releaseDate: currentSong.album.releaseDate,
            artist: {
              connect: { id: artist.id },
            },
          },
        });
      }
  
      if (song) {
        song = await prisma.song.update({
          where: {
            id: song.id
          },
          data: {
            name: currentSong.name,
            portrait: currentSong.portrait,
            iTunesId: currentSong.iTunesId,
            iTunesViewUrl: currentSong.iTunesViewUrl,
            previewUrl: currentSong.previewUrl,
            releaseDate: currentSong.releaseDate,
            durationInSeconds: currentSong.durationInSeconds,
            genre: currentSong.genre,
            artist: {
              connect: { id: artist.id },
            },
            album: {
              connect: { id: album?.id },
            },
          },
        });
      } else {
        song = await prisma.song.create({
          data: {
            name: currentSong.name,
            portrait: currentSong.portrait,
            iTunesId: currentSong.iTunesId,
            iTunesViewUrl: currentSong.iTunesViewUrl,
            previewUrl: currentSong.previewUrl,
            releaseDate: currentSong.releaseDate,
            durationInSeconds: currentSong.durationInSeconds,
            genre: currentSong.genre,
            artist: {
              connect: { id: artist.id },
            },
            album: {
              connect: { id: album?.id },
            },
          },
        });
      }
    }

    const favoritedArtist = await prisma.userFavoriteArtists.create({
      data: {
        artist: {
          connect: { id: artist.id }
        },
        user: {
          connect: { id: request.user.sub }
        },
      }
    })

    return {
      favoritedArtist
    }
  })

  app.delete('/favorites/song', async (request, reply) => {
    await request.jwtVerify();

    const bodySchema = z.object({
      songToBeUnfavorited: z.object({
        iTunesId: z.number(),
      })
    })

    const { songToBeUnfavorited } = bodySchema.parse(request.body);

    const song = await prisma.userFavoriteSongs.findFirst({
      where: {
        song: {
          iTunesId: songToBeUnfavorited.iTunesId,
        },
        userId: request.user.sub,
      }
    });

    if (!song) {
      reply.status(404).send('Música não encontrada.')
    }

    const unfavoritedSong = await prisma.userFavoriteSongs.delete({
      where: {
        id: song?.id
      }
    });

    return {
      unfavoritedSong
    };
  })

  app.delete('/favorites/album', async (request, reply) => {
    await request.jwtVerify();

    const bodySchema = z.object({
      albumToBeUnfavorited: z.object({
        iTunesId: z.number(),
      })
    })

    const { albumToBeUnfavorited } = bodySchema.parse(request.body);

    const album = await prisma.userFavoriteAlbums.findFirst({
      where: {
        album: {
          iTunesId: albumToBeUnfavorited.iTunesId,
        },
        userId: request.user.sub,
      }
    });

    if (!album) {
      reply.status(404).send('Álbum não encontrado.')
    }

    const unfavoritedAlbum = await prisma.userFavoriteAlbums.delete({
      where: {
        id: album?.id
      }
    });

    return {
      unfavoritedAlbum
    };
  })

  app.delete('/favorites/artist', async (request, reply) => {
    await request.jwtVerify();

    const bodySchema = z.object({
      artistToBeUnfavorited: z.object({
        iTunesId: z.number(),
      })
    })

    const { artistToBeUnfavorited } = bodySchema.parse(request.body);

    const artist = await prisma.userFavoriteArtists.findFirst({
      where: {
        artist: {
          iTunesId: artistToBeUnfavorited.iTunesId
        },
        userId: request.user.sub,
      }
    });

    if (!artist) {
      reply.status(404).send('Artista não encontrado.')
    }

    const unfavoritedArtist = await prisma.userFavoriteArtists.delete({
      where: {
        id: artist?.id
      }
    });

    return {
      unfavoritedArtist
    };
  })
}