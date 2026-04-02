import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

const IdParam = Type.Object({ id: Type.String() })

export const templateRoutes: FastifyPluginAsync = async (app) => {
  // List all templates
  app.get('/templates', async () => {
    return prisma.pageTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  })

  // Get single template
  app.get<{ Params: Static<typeof IdParam> }>(
    '/templates/:id',
    { schema: { params: IdParam } },
    async (request, reply) => {
      const template = await prisma.pageTemplate.findUnique({
        where: { id: request.params.id },
      })
      if (!template) return reply.status(404).send({ error: 'Template not found' })
      return template
    },
  )
}
