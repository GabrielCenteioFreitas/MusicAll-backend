import 'dotenv/config'

import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'

const app = fastify()

app.register(cors,{
	origin: true,
})

app.register(jwt, {
	 secret: 'musicall-backend-gabrielcenteiofreitas',
	 //uma forma de diferenciar os jwts gerados desse backend de outros backends, pode colocar QUALQUER coisa
})

app.register(authRoutes)

app
	.listen({
		port: process.env.PORT ? Number(process.env.PORT) : 3333,
	}).then(() => {
		console.log('🚀 HTTP server running')
	})