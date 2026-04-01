import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { CreateSpaceBody, UpdateSpaceBody, IdParam } from '../schemas/space.js'
import type { Static } from '@sinclair/typebox'

export const spaceRoutes: FastifyPluginAsync = async (app) => {
  // List all spaces
  app.get('/spaces', async () => {
    return prisma.space.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { pages: true } },
      },
    })
  })

  // Create space
  app.post<{ Body: Static<typeof CreateSpaceBody> }>(
    '/spaces',
    { schema: { body: CreateSpaceBody } },
    async (request, reply) => {
      const space = await prisma.space.create({
        data: request.body,
      })
      return reply.status(201).send(space)
    },
  )

  // Get space with pages
  app.get<{ Params: Static<typeof IdParam> }>(
    '/spaces/:id',
    { schema: { params: IdParam } },
    async (request, reply) => {
      const space = await prisma.space.findUnique({
        where: { id: request.params.id },
        include: {
          pages: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      })
      if (!space) return reply.status(404).send({ error: 'Space not found' })
      return space
    },
  )

  // Update space
  app.patch<{ Params: Static<typeof IdParam>; Body: Static<typeof UpdateSpaceBody> }>(
    '/spaces/:id',
    { schema: { params: IdParam, body: UpdateSpaceBody } },
    async (request, reply) => {
      try {
        const space = await prisma.space.update({
          where: { id: request.params.id },
          data: request.body,
        })
        return space
      } catch {
        return reply.status(404).send({ error: 'Space not found' })
      }
    },
  )

  // Delete space
  app.delete<{ Params: Static<typeof IdParam> }>(
    '/spaces/:id',
    { schema: { params: IdParam } },
    async (request, reply) => {
      try {
        await prisma.space.delete({ where: { id: request.params.id } })
        return { success: true }
      } catch {
        return reply.status(404).send({ error: 'Space not found' })
      }
    },
  )
}
