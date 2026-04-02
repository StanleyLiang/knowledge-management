import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

const SearchQuery = Type.Object({
  q: Type.String({ minLength: 1 }),
})

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: Static<typeof SearchQuery> }>(
    '/search',
    { schema: { querystring: SearchQuery } },
    async (request) => {
      const { q } = request.query
      const pages = await prisma.page.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          status: true,
          spaceId: true,
          createdAt: true,
          updatedAt: true,
          space: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })

      return pages.map(({ space, ...page }) => ({
        ...page,
        spaceName: space.name,
      }))
    },
  )
}
