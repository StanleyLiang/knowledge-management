import Fastify from 'fastify'
import cors from '@fastify/cors'
import { spaceRoutes } from './routes/spaces.js'
import { pageRoutes } from './routes/pages.js'
import { searchRoutes } from './routes/search.js'
import { templateRoutes } from './routes/templates.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })
  await app.register(spaceRoutes, { prefix: '/api' })
  await app.register(pageRoutes, { prefix: '/api' })
  await app.register(searchRoutes, { prefix: '/api' })
  await app.register(templateRoutes, { prefix: '/api' })

  return app
}
