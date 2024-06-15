import "dotenv/config";

import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fastify from "fastify";
import { authRoutes } from "./routes/auth";
import { playlistsRoutes } from "./routes/playlists";
import { favoritesRoutes } from "./routes/favorites";
import { usersRoutes } from "./routes/users";

const app = fastify();

app.register(cors, {
  origin: true,
});

app.register(jwt, {
  secret: "musicall-backend-gabrielcenteiofreitas",
  // uma forma de diferenciar os jwts gerados desse backend de outros backends, pode colocar QUALQUER coisa
});

app.register(authRoutes);
app.register(playlistsRoutes);
app.register(favoritesRoutes);
app.register(usersRoutes);

app
  .listen({
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log("🚀 HTTP server running");
  });
