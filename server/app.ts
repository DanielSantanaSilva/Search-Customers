import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZodError } from 'zod'
import { followupCreateSchema, followupQuerySchema, leadCreateSchema, leadPatchSchema, leadStatusSchema } from './domain.ts'
import type { LeadService } from './services/lead-service.ts'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const publicDirectory = resolve(moduleDirectory, '../dist')

export const createApp = async (leadService: LeadService) => {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_048_576,
  })

  await app.register(cors, {
    origin: [/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  app.get('/api/health', async () => ({ status: 'ok' }))

  app.get('/api/leads', async (request) => {
    const query = request.query as { status?: string }
    const status = query.status ? leadStatusSchema.parse(query.status) : undefined
    return leadService.list(status)
  })

  app.get('/api/leads/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const lead = leadService.get(slug)
    return lead ?? reply.code(404).send({ message: 'Lead não encontrado' })
  })

  app.post('/api/leads', async (request, reply) => {
    const lead = leadService.create(leadCreateSchema.parse(request.body))
    return reply.code(201).send(lead)
  })

  app.patch('/api/leads/:slug', async (request) => {
    const { slug } = request.params as { slug: string }
    return leadService.update(slug, leadPatchSchema.parse(request.body))
  })

  app.delete('/api/leads/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const removed = leadService.remove(slug)
    return removed ? reply.code(204).send() : reply.code(404).send({ message: 'Lead não encontrado' })
  })

  app.get('/api/dashboard/summary', async () => leadService.summary())

  app.get('/api/followups', async (request) => {
    const { days } = followupQuerySchema.parse(request.query)
    return leadService.dueFollowups(days)
  })

  app.post('/api/leads/:slug/followups', async (request) => {
    const { slug } = request.params as { slug: string }
    const { details } = followupCreateSchema.parse(request.body ?? {})
    return leadService.recordFollowup(slug, details)
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: 'Dados inválidos', issues: error.issues })
    }

    if (error instanceof Error && error.message === 'Lead não encontrado') {
      return reply.code(404).send({ message: error.message })
    }

    if (error instanceof Error && error.message === 'Follow-up disponível apenas para leads em proposta') {
      return reply.code(409).send({ message: error.message })
    }

    app.log.error(error)
    return reply.code(500).send({ message: 'Erro interno do servidor' })
  })

  if (existsSync(publicDirectory)) {
    await app.register(fastifyStatic, {
      root: publicDirectory,
      wildcard: false,
    })

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ message: 'Rota não encontrada' })
      }
      return reply.sendFile('index.html')
    })
  }

  return app
}
