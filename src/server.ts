import "dotenv/config";

import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fastify from "fastify";
import { authRoutes } from "./routes/auth";
import { playlistsRoutes } from "./routes/playlists";
import { favoritesRoutes } from "./routes/favorites";
import { usersRoutes } from "./routes/users";
import { songsRoutes } from "./routes/songs";

const app = fastify();

app.register(cors, {
  origin: true,
});

app.register(jwt, {
  secret: "musicall-backend-gabrielcenteiofreitas",
});

app.register(authRoutes);
app.register(playlistsRoutes);
app.register(favoritesRoutes);
app.register(usersRoutes);
app.register(songsRoutes);

app
  .listen({
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log("🚀 HTTP server running");
  });
