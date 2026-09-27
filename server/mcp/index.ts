import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { database } from '../db/database.ts'
import { leadCreateSchema, leadPatchSchema, leadStatusSchema } from '../domain.ts'
import { LeadService } from '../services/lead-service.ts'

const service = new LeadService(database)
const server = new McpServer({
  name: 'search-customers-crm',
  version: '1.0.0',
})

const result = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  structuredContent: { data },
})

server.registerTool(
  'lead_list',
  {
    title: 'Listar leads',
    description: 'Lista leads do CRM e permite filtrar pelo status do pipeline.',
    inputSchema: { status: leadStatusSchema.optional() },
  },
  ({ status }) => result(service.list(status)),
)

server.registerTool(
  'lead_get',
  {
    title: 'Consultar lead',
    description: 'Busca um lead pelo slug.',
    inputSchema: { slug: z.string().min(2) },
  },
  ({ slug }) => result(service.get(slug) ?? { error: 'Lead não encontrado' }),
)

server.registerTool(
  'lead_upsert',
  {
    title: 'Salvar lead',
    description: 'Cria um lead ou atualiza seus dados básicos sem apagar dados do pipeline.',
    inputSchema: leadCreateSchema,
  },
  (input) => result(service.create(input)),
)

server.registerTool(
  'lead_patch',
  {
    title: 'Atualizar lead',
    description: 'Atualiza parcialmente um lead existente.',
    inputSchema: { slug: z.string().min(2), patch: leadPatchSchema },
  },
  ({ slug, patch }) => result(service.update(slug, patch)),
)

server.registerTool(
  'lead_transition_status',
  {
    title: 'Alterar status',
    description: 'Move um lead para outra etapa do pipeline.',
    inputSchema: {
      slug: z.string().min(2),
      status: leadStatusSchema,
      observacao: z.string().max(1_500).optional(),
    },
  },
  ({ slug, status, observacao }) =>
    result(service.update(slug, { status, ...(observacao ? { observacoes: observacao } : {}) })),
)

server.registerTool(
  'followup_list_due',
  {
    title: 'Listar follow-ups',
    description: 'Lista propostas que aguardam follow-up.',
    inputSchema: { days: z.number().int().min(1).max(30).default(3) },
  },
  ({ days }) => result(service.dueFollowups(days)),
)

server.registerTool(
  'followup_record',
  {
    title: 'Registrar follow-up',
    description: 'Registra que um follow-up foi realizado para o lead.',
    inputSchema: {
      slug: z.string().min(2),
      details: z.string().max(1_500).optional(),
    },
  },
  ({ slug, details }) => result(service.recordFollowup(slug, details)),
)

server.registerTool(
  'finance_summary',
  {
    title: 'Resumo financeiro',
    description: 'Calcula valores fechados, recebidos, pendentes, MRR e projeção anual.',
  },
  () => result(service.summary()),
)

await server.connect(new StdioServerTransport())
