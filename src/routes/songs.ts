import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function songsRoutes(app: FastifyInstance) {
  app.get('/songs/:genre', async (request, reply) => {
    const paramsSchema = z.object({
      genre: z.string(),
    })

    const { genre } = paramsSchema.parse(request.params)

    const querySchema = z.object({
      limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    })

    const { limit } = querySchema.parse(request.query)

    const songs = await prisma.song.findMany({
      where: {
        genre,
      },
      include: {
        artist: {
          select: {
            name: true,
            iTunesId: true,
          }
        },
        album: {
          select: {
            iTunesId: true,
          }
        }
      }
    })

    if (!songs) {
      return reply.status(404).send('Nenhuma música foi encontrada.');
    }

    const shuffledSongs = songs.sort(() => 0.5 - Math.random())
    const limitedSongs = limit ? shuffledSongs.slice(0, limit) : shuffledSongs

    return {
      songs: limitedSongs
    }
  })
}