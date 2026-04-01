import Fastify from 'fastify'
import cors from '@fastify/cors'
import { spaceRoutes } from './routes/spaces.js'
import { pageRoutes } from './routes/pages.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })
  await app.register(spaceRoutes, { prefix: '/api' })
  await app.register(pageRoutes, { prefix: '/api' })

  return app
}
