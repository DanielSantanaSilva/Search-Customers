export const leadStatuses = [
  'novo',
  'redesenhado',
  'publicado',
  'proposta',
  'respondeu',
  'fechado',
  'descartado',
] as const

export type LeadStatus = (typeof leadStatuses)[number]

export interface Lead {
  slug: string
  nome: string
  nicho: string
  cidade: string
  nota: number | null
  avaliacoes: number
  email: string
  telefone: string
  whatsapp: string
  siteAntigo: string
  motivo: string
  status: LeadStatus
  urlNova: string
  dataProposta: string | null
  valor: number | null
  observacoes: string
  contratoStatus: 'pendente' | 'enviado' | 'assinado'
  manutencao: number
  pago: boolean
  documentoCliente: string
  enderecoCliente: string
  criadoEm: string
  atualizadoEm: string
}

export type LeadPatch = Partial<Pick<Lead,
  | 'nome'
  | 'nicho'
  | 'cidade'
  | 'nota'
  | 'avaliacoes'
  | 'email'
  | 'telefone'
  | 'whatsapp'
  | 'siteAntigo'
  | 'motivo'
  | 'status'
  | 'urlNova'
  | 'valor'
  | 'observacoes'
  | 'contratoStatus'
  | 'manutencao'
  | 'pago'
  | 'documentoCliente'
  | 'enderecoCliente'
>>

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
