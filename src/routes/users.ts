import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function usersRoutes (app: FastifyInstance) {
  app.get('/users/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        playlists: {
          where: {
            isPublic: true,
          },
          include: {
            songs: {
              select: {
                song: {
                  select: {
                    portrait: true,
                  }
                }
              }
            }
          },
        },
        favoriteSongs: {
          include: {
            song: {
              include: {
                artist: true,
                album: true,
              },
            },
          },
          orderBy: {
            favoritedAt: 'desc',
          },
        },
        favoriteAlbums: {
          include: {
            album: {
              include: {
                artist: true,
              },
            },
          },
          orderBy: {
            favoritedAt: 'desc',
          },
        },
        favoriteArtists: {
          include: {
            artist: true,
          },
          orderBy: {
            favoritedAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      return reply.status(404).send('Usuário não encontrado');
    }

    const { name, avatarUrl, createdAt, playlists, favoriteSongs, favoriteAlbums, favoriteArtists } = user

    return {
      user: {
        name,
        id: user.id,
        avatarUrl,
        createdAt,
        playlists,
        favoriteSongs,
        favoriteAlbums,
        favoriteArtists,
      }
    };
  })

  app.put('/users/:id', async (request, reply) => {
    await request.jwtVerify()

    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(request.params)

    if (id !== request.user.sub) {
      return reply.status(403).send('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: {
        id
      }
    })

    if (!user) {
      return reply.status(404).send('Usuário não encontrado');
    }

    const bodySchema = z.object({
      name: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    })

    const { name, avatarUrl } = bodySchema.parse(request.body)

    const updatedUser = await prisma.user.update({
      where: {
        id
      },
      data: {
        name,
        avatarUrl,
      }
    })

    const token = app.jwt.sign(
      {
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: "30 days",
      },
    );

    return {
      token,
    };
  })
}