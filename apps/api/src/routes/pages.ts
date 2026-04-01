import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { CreatePageBody, UpdatePageBody, SpaceIdParam, PageIdParam } from '../schemas/page.js'
import type { Static } from '@sinclair/typebox'

export const pageRoutes: FastifyPluginAsync = async (app) => {
  // List pages in a space (no content field)
  app.get<{ Params: Static<typeof SpaceIdParam> }>(
    '/spaces/:spaceId/pages',
    { schema: { params: SpaceIdParam } },
    async (request) => {
      return prisma.page.findMany({
        where: { spaceId: request.params.spaceId },
        select: {
          id: true,
          title: true,
          status: true,
          spaceId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      })
    },
  )

  // Create page in a space
  app.post<{ Params: Static<typeof SpaceIdParam>; Body: Static<typeof CreatePageBody> }>(
    '/spaces/:spaceId/pages',
    { schema: { params: SpaceIdParam, body: CreatePageBody } },
    async (request, reply) => {
      const page = await prisma.page.create({
        data: {
          title: request.body.title ?? 'Untitled',
          spaceId: request.params.spaceId,
        },
      })
      return reply.status(201).send(page)
    },
  )

  // Get single page with content
  app.get<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id',
    { schema: { params: PageIdParam } },
    async (request, reply) => {
      const page = await prisma.page.findUnique({
        where: { id: request.params.id },
      })
      if (!page) return reply.status(404).send({ error: 'Page not found' })
      return page
    },
  )

  // Update page
  app.patch<{ Params: Static<typeof PageIdParam>; Body: Static<typeof UpdatePageBody> }>(
    '/pages/:id',
    { schema: { params: PageIdParam, body: UpdatePageBody } },
    async (request, reply) => {
      try {
        const page = await prisma.page.update({
          where: { id: request.params.id },
          data: request.body,
        })
        return page
      } catch {
        return reply.status(404).send({ error: 'Page not found' })
      }
    },
  )

  // Delete page
  app.delete<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id',
    { schema: { params: PageIdParam } },
    async (request, reply) => {
      try {
        await prisma.page.delete({ where: { id: request.params.id } })
        return { success: true }
      } catch {
        return reply.status(404).send({ error: 'Page not found' })
      }
    },
  )
}
