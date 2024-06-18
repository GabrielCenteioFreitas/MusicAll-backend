import axios from "axios";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request) => {
    const bodySchema = z.object({
      code: z.string(),
    });

    const { code } = bodySchema.parse(request.body);

    const redirectURI =
      process.env.NODE_ENV === "production"
        ? "https://musicall-project.vercel.app/api/auth/callback"
        : "http://localhost:3000/api/auth/callback";

    const accessTokenResponse = await axios
      .post(
        "https://oauth2.googleapis.com/token",
        null,
        {
          params: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: redirectURI,
            grant_type: "authorization_code",
          },
          headers: {
            Accept: "application/json",
          },
        },
      )
      .catch((error) => {
        console.log(error);
      });

    const { access_token: acessToken } = accessTokenResponse?.data;

    const userResponse = await axios
      .get("https://people.googleapis.com/v1/people/me", {
        params: {
          personFields: "names,photos,metadata",
        },
        headers: {
          Authorization: `Bearer ${acessToken}`,
        },
      })
      .catch((error) => {
        console.log(error);
      });

    const userSchema = z.object({
      metadata: z.object({
        sources: z.array(
          z.object({
            id: z.string(),
          }),
        ),
      }),
      names: z.array(
        z.object({
          displayName: z.string(),
        }),
      ),
      photos: z.array(
        z.object({
          url: z.string().url(),
        }),
      ),
    });

    const userInfo = userSchema.parse(userResponse?.data);

    let user;

    try {
      user = await prisma.user.findUnique({
        where: {
          googleId: userInfo.metadata.sources[0].id,
        },
      });
    } catch (error) {
      console.log(error);
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.metadata.sources[0].id,
          name: userInfo.names[0].displayName,
          avatarUrl: userInfo.photos[0].url,
        },
      });
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: "30 days",
      },
    );

    return {
      token,
    };
  });
}
