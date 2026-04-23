import type { FastifyPluginAsync } from 'fastify'
import type { Static } from '@sinclair/typebox'
import { prisma } from '../lib/prisma.js'
import { embedSpace, generateSyntheses } from '../lib/synthesis/pipeline.js'
import {
  GenerateBody,
  ListSynthesesQuery,
  SynthesisIdParam,
  SynthesisSpaceParam,
  UpdateSynthesisBody,
} from '../schemas/synthesis.js'

export const synthesisRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Params: Static<typeof SynthesisSpaceParam> }>(
    '/spaces/:spaceId/syntheses/embed',
    { schema: { params: SynthesisSpaceParam } },
    async (request) => embedSpace(request.params.spaceId),
  )

  app.post<{
    Params: Static<typeof SynthesisSpaceParam>
    Body: Static<typeof GenerateBody>
  }>(
    '/spaces/:spaceId/syntheses/generate',
    { schema: { params: SynthesisSpaceParam, body: GenerateBody } },
    async (request) => {
      await embedSpace(request.params.spaceId)
      return generateSyntheses(request.params.spaceId, request.body)
    },
  )

  app.get<{ Querystring: Static<typeof ListSynthesesQuery> }>(
    '/syntheses',
    { schema: { querystring: ListSynthesesQuery } },
    async (request) => {
      const { spaceId, status } = request.query
      return prisma.synthesis.findMany({
        where: { spaceId, ...(status ? { status } : {}) },
        orderBy: { createdAt: 'desc' },
        include: {
          sources: {
            include: { page: { select: { id: true, title: true, spaceId: true } } },
          },
        },
      })
    },
  )

  app.get<{ Params: Static<typeof SynthesisIdParam> }>(
    '/syntheses/:id',
    { schema: { params: SynthesisIdParam } },
    async (request, reply) => {
      const synthesis = await prisma.synthesis.findUnique({
        where: { id: request.params.id },
        include: {
          sources: {
            include: { page: { select: { id: true, title: true, spaceId: true } } },
          },
        },
      })
      if (!synthesis) return reply.status(404).send({ error: 'Synthesis not found' })
      return synthesis
    },
  )

  app.patch<{
    Params: Static<typeof SynthesisIdParam>
    Body: Static<typeof UpdateSynthesisBody>
  }>(
    '/syntheses/:id',
    { schema: { params: SynthesisIdParam, body: UpdateSynthesisBody } },
    async (request, reply) => {
      try {
        return await prisma.synthesis.update({
          where: { id: request.params.id },
          data: request.body,
        })
      } catch {
        return reply.status(404).send({ error: 'Synthesis not found' })
      }
    },
  )

  app.delete<{ Params: Static<typeof SynthesisIdParam> }>(
    '/syntheses/:id',
    { schema: { params: SynthesisIdParam } },
    async (request, reply) => {
      try {
        await prisma.synthesis.delete({ where: { id: request.params.id } })
        return { success: true }
      } catch {
        return reply.status(404).send({ error: 'Synthesis not found' })
      }
    },
  )
}
