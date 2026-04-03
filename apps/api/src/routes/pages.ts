import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { CreatePageBody, UpdatePageBody, SpaceIdParam, PageIdParam, VersionIdParam } from '../schemas/page.js'
import type { Static } from '@sinclair/typebox'

const DEFAULT_AUTHOR = process.env.DEFAULT_AUTHOR || 'Admin'

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
          author: true,
          spaceId: true,
          publishedVersionId: true,
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
          content: request.body.content ?? undefined,
          author: DEFAULT_AUTHOR,
          spaceId: request.params.spaceId,
        },
      })
      return reply.status(201).send(page)
    },
  )

  // Get single page with content + published version
  app.get<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id',
    { schema: { params: PageIdParam } },
    async (request, reply) => {
      const page = await prisma.page.findUnique({
        where: { id: request.params.id },
      })
      if (!page) return reply.status(404).send({ error: 'Page not found' })

      // Fetch published version if exists
      let publishedVersion = null
      if (page.publishedVersionId) {
        publishedVersion = await prisma.pageVersion.findUnique({
          where: { id: page.publishedVersionId },
        })
      }

      return { ...page, publishedVersion }
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

  // ── Publish ──
  app.post<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id/publish',
    { schema: { params: PageIdParam } },
    async (request, reply) => {
      const page = await prisma.page.findUnique({ where: { id: request.params.id } })
      if (!page) return reply.status(404).send({ error: 'Page not found' })
      if (!page.content) return reply.status(400).send({ error: 'Cannot publish a page without content' })

      // Determine next version number
      const lastVersion = await prisma.pageVersion.findFirst({
        where: { pageId: page.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      const nextVersion = (lastVersion?.version ?? 0) + 1

      // Create version + update page in transaction
      const [version] = await prisma.$transaction([
        prisma.pageVersion.create({
          data: {
            pageId: page.id,
            version: nextVersion,
            title: page.title,
            content: page.content,
            author: DEFAULT_AUTHOR,
          },
        }),
        prisma.page.update({
          where: { id: page.id },
          data: { status: 'PUBLISHED', publishedVersionId: undefined }, // set below
        }),
      ])

      // Set publishedVersionId (needs the created version id)
      const updated = await prisma.page.update({
        where: { id: page.id },
        data: { publishedVersionId: version.id },
      })

      return { ...updated, publishedVersion: version }
    },
  )

  // ── Unpublish ──
  app.post<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id/unpublish',
    { schema: { params: PageIdParam } },
    async (request, reply) => {
      try {
        const page = await prisma.page.update({
          where: { id: request.params.id },
          data: { status: 'DRAFT', publishedVersionId: null },
        })
        return page
      } catch {
        return reply.status(404).send({ error: 'Page not found' })
      }
    },
  )

  // ── List versions ──
  app.get<{ Params: Static<typeof PageIdParam> }>(
    '/pages/:id/versions',
    { schema: { params: PageIdParam } },
    async (request) => {
      return prisma.pageVersion.findMany({
        where: { pageId: request.params.id },
        select: {
          id: true,
          pageId: true,
          version: true,
          title: true,
          author: true,
          createdAt: true,
        },
        orderBy: { version: 'desc' },
      })
    },
  )

  // ── Get specific version ──
  app.get<{ Params: Static<typeof VersionIdParam> }>(
    '/pages/:id/versions/:versionId',
    { schema: { params: VersionIdParam } },
    async (request, reply) => {
      const version = await prisma.pageVersion.findFirst({
        where: { id: request.params.versionId, pageId: request.params.id },
      })
      if (!version) return reply.status(404).send({ error: 'Version not found' })
      return version
    },
  )

  // ── Restore version to draft ──
  app.post<{ Params: Static<typeof VersionIdParam> }>(
    '/pages/:id/restore/:versionId',
    { schema: { params: VersionIdParam } },
    async (request, reply) => {
      const version = await prisma.pageVersion.findFirst({
        where: { id: request.params.versionId, pageId: request.params.id },
      })
      if (!version) return reply.status(404).send({ error: 'Version not found' })

      const page = await prisma.page.update({
        where: { id: request.params.id },
        data: {
          title: version.title,
          content: version.content,
        },
      })
      return page
    },
  )
}
