import type { Database } from 'better-sqlite3'
import {
  leadStatuses,
  type DashboardSummary,
  type Lead,
  type LeadCreate,
  type LeadPatch,
  type LeadStatus,
} from '../domain.ts'

type LeadRow = {
  slug: string
  nome: string
  nicho: string
  cidade: string
  nota: number | null
  avaliacoes: number
  email: string
  telefone: string
  whatsapp: string
  site_antigo: string
  motivo: string
  status: LeadStatus
  url_nova: string
  data_proposta: string | null
  valor: number | null
  observacoes: string
  contrato_status: Lead['contratoStatus']
  manutencao: number
  pago: number
  documento_cliente: string
  endereco_cliente: string
  criado_em: string
  atualizado_em: string
}

const columnByField = {
  nome: 'nome',
  nicho: 'nicho',
  cidade: 'cidade',
  nota: 'nota',
  avaliacoes: 'avaliacoes',
  email: 'email',
  telefone: 'telefone',
  whatsapp: 'whatsapp',
  siteAntigo: 'site_antigo',
  motivo: 'motivo',
  status: 'status',
  urlNova: 'url_nova',
  valor: 'valor',
  observacoes: 'observacoes',
  contratoStatus: 'contrato_status',
  manutencao: 'manutencao',
  pago: 'pago',
  documentoCliente: 'documento_cliente',
  enderecoCliente: 'endereco_cliente',
} satisfies Record<keyof LeadPatch, string>

const mapLead = (row: LeadRow): Lead => ({
  slug: row.slug,
  nome: row.nome,
  nicho: row.nicho,
  cidade: row.cidade,
  nota: row.nota,
  avaliacoes: row.avaliacoes,
  email: row.email,
  telefone: row.telefone,
  whatsapp: row.whatsapp,
  siteAntigo: row.site_antigo,
  motivo: row.motivo,
  status: row.status,
  urlNova: row.url_nova,
  dataProposta: row.data_proposta,
  valor: row.valor,
  observacoes: row.observacoes,
  contratoStatus: row.contrato_status,
  manutencao: row.manutencao,
  pago: row.pago === 1,
  documentoCliente: row.documento_cliente,
  enderecoCliente: row.endereco_cliente,
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
})

export class LeadService {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  list(status?: LeadStatus): Lead[] {
    const rows = status
      ? this.db
          .prepare('SELECT * FROM leads WHERE excluido_em IS NULL AND status = ? ORDER BY atualizado_em DESC')
          .all(status)
      : this.db
          .prepare('SELECT * FROM leads WHERE excluido_em IS NULL ORDER BY atualizado_em DESC')
          .all()

    return (rows as LeadRow[]).map(mapLead)
  }

  get(slug: string): Lead | null {
    const row = this.db
      .prepare('SELECT * FROM leads WHERE slug = ? AND excluido_em IS NULL')
      .get(slug) as LeadRow | undefined

    return row ? mapLead(row) : null
  }

  create(input: LeadCreate): Lead {
    const statement = this.db.prepare(`
      INSERT INTO leads (
        slug, nome, nicho, cidade, nota, avaliacoes, email, telefone,
        whatsapp, site_antigo, motivo, url_nova, observacoes
      ) VALUES (
        @slug, @nome, @nicho, @cidade, @nota, @avaliacoes, @email, @telefone,
        @whatsapp, @siteAntigo, @motivo, @urlNova, @observacoes
      )
      ON CONFLICT(slug) DO UPDATE SET
        nome = excluded.nome,
        nicho = excluded.nicho,
        cidade = excluded.cidade,
        nota = excluded.nota,
        avaliacoes = excluded.avaliacoes,
        email = excluded.email,
        telefone = excluded.telefone,
        whatsapp = excluded.whatsapp,
        site_antigo = excluded.site_antigo,
        motivo = excluded.motivo,
        url_nova = excluded.url_nova,
        observacoes = excluded.observacoes,
        excluido_em = NULL,
        atualizado_em = CURRENT_TIMESTAMP
    `)

    const save = this.db.transaction(() => {
      statement.run(input)
      this.recordEvent(input.slug, 'lead_salvo', 'Lead criado ou atualizado')
    })
    save()

    return this.getOrThrow(input.slug)
  }

  update(slug: string, patch: LeadPatch): Lead {
    const current = this.getOrThrow(slug)
    const entries = Object.entries(patch) as [keyof LeadPatch, LeadPatch[keyof LeadPatch]][]
    if (entries.length === 0) {
      return current
    }

    const assignments = entries.map(([field]) => `${columnByField[field]} = @${field}`)
    const values = Object.fromEntries(
      entries.map(([field, value]) => [field, typeof value === 'boolean' ? Number(value) : value]),
    )

    if (patch.status === 'proposta' && current.status !== 'proposta') {
      assignments.push('data_proposta = CURRENT_TIMESTAMP')
    }

    const update = this.db.transaction(() => {
      const result = this.db
        .prepare(`UPDATE leads SET ${assignments.join(', ')}, atualizado_em = CURRENT_TIMESTAMP WHERE slug = @slug AND excluido_em IS NULL`)
        .run({ ...values, slug })

      if (result.changes === 0) {
        throw new Error('Lead não encontrado')
      }

      if (patch.status) {
        this.recordEvent(slug, 'status_alterado', patch.status)
      } else {
        this.recordEvent(slug, 'lead_atualizado', Object.keys(patch).join(', '))
      }
    })
    update()

    return this.getOrThrow(slug)
  }

  remove(slug: string): boolean {
    const remove = this.db.transaction(() => {
      if (!this.get(slug)) {
        return false
      }

      this.recordEvent(slug, 'lead_excluido', 'Exclusão lógica')
      const result = this.db
        .prepare('UPDATE leads SET excluido_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE slug = ? AND excluido_em IS NULL')
        .run(slug)
      return result.changes > 0
    })

    return remove()
  }

  dueFollowups(days = 3): Lead[] {
    const modifier = `-${days} days`
    const rows = this.db
      .prepare(`
        SELECT * FROM leads
        WHERE excluido_em IS NULL
          AND status = 'proposta'
          AND data_proposta IS NOT NULL
          AND datetime(data_proposta) <= datetime('now', ?)
          AND NOT EXISTS (
            SELECT 1 FROM pipeline_events
            WHERE lead_slug = leads.slug
              AND tipo = 'followup_registrado'
              AND datetime(criado_em) >= datetime(leads.data_proposta)
          )
        ORDER BY data_proposta ASC
      `)
      .all(modifier) as LeadRow[]

    return rows.map(mapLead)
  }

  recordFollowup(slug: string, details = 'Follow-up realizado'): Lead {
    const lead = this.getOrThrow(slug)
    if (lead.status !== 'proposta') {
      throw new Error('Follow-up disponível apenas para leads em proposta')
    }
    this.recordEvent(slug, 'followup_registrado', details)
    return lead
  }

  summary(): DashboardSummary {
    const leads = this.list()
    const porStatus = Object.fromEntries(leadStatuses.map((status) => [status, 0])) as Record<LeadStatus, number>

    for (const lead of leads) {
      porStatus[lead.status] += 1
    }

    const closed = leads.filter((lead) => lead.status === 'fechado')
    const totalFechado = closed.reduce((sum, lead) => sum + (lead.valor ?? 0), 0)
    const totalRecebido = closed.filter((lead) => lead.pago).reduce((sum, lead) => sum + (lead.valor ?? 0), 0)
    const mrr = closed.reduce((sum, lead) => sum + lead.manutencao, 0)

    return {
      total: leads.length,
      porStatus,
      totalFechado,
      totalRecebido,
      aReceber: totalFechado - totalRecebido,
      mrr,
      projecaoDozeMeses: totalFechado + mrr * 12,
      followupsPendentes: this.dueFollowups().length,
    }
  }

  private getOrThrow(slug: string): Lead {
    const lead = this.get(slug)
    if (!lead) {
      throw new Error('Lead não encontrado')
    }
    return lead
  }

  private recordEvent(slug: string, type: string, details: string): void {
    this.db
      .prepare('INSERT INTO pipeline_events (lead_slug, tipo, detalhes) VALUES (?, ?, ?)')
      .run(slug, type, details)
  }
}
