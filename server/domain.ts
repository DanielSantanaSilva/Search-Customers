import { z } from 'zod'

export const leadStatuses = [
  'novo',
  'redesenhado',
  'publicado',
  'proposta',
  'respondeu',
  'fechado',
  'descartado',
] as const

export const contractStatuses = ['pendente', 'enviado', 'assinado'] as const

export const leadStatusSchema = z.enum(leadStatuses)
export const contractStatusSchema = z.enum(contractStatuses)

export const leadCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nome: z.string().trim().min(2).max(160),
  nicho: z.string().trim().max(100).default(''),
  cidade: z.string().trim().max(120).default(''),
  nota: z.number().min(0).max(5).nullable().default(null),
  avaliacoes: z.number().int().min(0).default(0),
  email: z.union([z.literal(''), z.email()]).default(''),
  telefone: z.string().trim().max(40).default(''),
  whatsapp: z.string().trim().max(40).default(''),
  siteAntigo: z.union([z.literal(''), z.url()]).default(''),
  motivo: z.string().trim().max(1_500).default(''),
  urlNova: z.union([z.literal(''), z.url()]).default(''),
  observacoes: z.string().trim().max(5_000).default(''),
})

export const leadPatchSchema = leadCreateSchema
  .omit({ slug: true })
  .partial()
  .extend({
    status: leadStatusSchema.optional(),
    valor: z.number().min(0).nullable().optional(),
    manutencao: z.number().min(0).optional(),
    pago: z.boolean().optional(),
    contratoStatus: contractStatusSchema.optional(),
    documentoCliente: z.string().trim().max(40).optional(),
    enderecoCliente: z.string().trim().max(240).optional(),
  })

export type LeadStatus = z.infer<typeof leadStatusSchema>
export type ContractStatus = z.infer<typeof contractStatusSchema>
export type LeadCreate = z.infer<typeof leadCreateSchema>
export type LeadPatch = z.infer<typeof leadPatchSchema>

export interface Lead extends LeadCreate {
  status: LeadStatus
  valor: number | null
  manutencao: number
  pago: boolean
  contratoStatus: ContractStatus
  documentoCliente: string
  enderecoCliente: string
  dataProposta: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface DashboardSummary {
  total: number
  porStatus: Record<LeadStatus, number>
  totalFechado: number
  totalRecebido: number
  aReceber: number
  mrr: number
  projecaoDozeMeses: number
  followupsPendentes: number
}
