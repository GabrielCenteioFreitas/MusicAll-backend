import fastify from 'fastify'

const app = fastify()

app
	.listen({
		port: process.env.PORT ? Number(process.env.PORT) : 3333,
	}).then(() => {
		console.log('🚀 HTTP server running')
	})