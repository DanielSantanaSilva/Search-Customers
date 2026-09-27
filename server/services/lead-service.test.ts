import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { LeadService } from './lead-service.ts'

const createDatabase = () => {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE leads (
      slug TEXT PRIMARY KEY, nome TEXT NOT NULL, nicho TEXT NOT NULL DEFAULT '', cidade TEXT NOT NULL DEFAULT '',
      nota REAL, avaliacoes INTEGER NOT NULL DEFAULT 0, email TEXT NOT NULL DEFAULT '', telefone TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '', site_antigo TEXT NOT NULL DEFAULT '', motivo TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'novo', url_nova TEXT NOT NULL DEFAULT '', data_proposta TEXT, valor REAL,
      observacoes TEXT NOT NULL DEFAULT '', contrato_status TEXT NOT NULL DEFAULT 'pendente', manutencao REAL NOT NULL DEFAULT 0,
      pago INTEGER NOT NULL DEFAULT 0, documento_cliente TEXT NOT NULL DEFAULT '', endereco_cliente TEXT NOT NULL DEFAULT '',
      excluido_em TEXT, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE pipeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, lead_slug TEXT NOT NULL, tipo TEXT NOT NULL,
      detalhes TEXT NOT NULL DEFAULT '', criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  return db
}

let service: LeadService

beforeEach(() => {
  service = new LeadService(createDatabase())
})

describe('LeadService', () => {
  it('cria, atualiza e lista um lead sem perder o status', () => {
    service.create({
      slug: 'clinica-vida', nome: 'Clínica Vida', nicho: 'Clínica', cidade: 'Curitiba', nota: 4.9,
      avaliacoes: 120, email: 'contato@clinica.test', telefone: '', whatsapp: '', siteAntigo: '', motivo: '', urlNova: '', observacoes: '',
    })
    service.update('clinica-vida', { status: 'proposta', valor: 2500 })
    service.create({
      slug: 'clinica-vida', nome: 'Clínica Vida Atualizada', nicho: 'Clínica', cidade: 'Curitiba', nota: 4.9,
      avaliacoes: 121, email: 'contato@clinica.test', telefone: '', whatsapp: '', siteAntigo: '', motivo: '', urlNova: '', observacoes: '',
    })

    const lead = service.get('clinica-vida')
    expect(lead?.nome).toBe('Clínica Vida Atualizada')
    expect(lead?.status).toBe('proposta')
    expect(lead?.valor).toBe(2500)
    expect(service.list()).toHaveLength(1)
  })

  it('calcula o resumo financeiro', () => {
    service.create({ slug: 'lead-a', nome: 'Lead A', nicho: '', cidade: '', nota: null, avaliacoes: 0, email: '', telefone: '', whatsapp: '', siteAntigo: '', motivo: '', urlNova: '', observacoes: '' })
    service.update('lead-a', { status: 'fechado', valor: 3000, manutencao: 200, pago: true })

    expect(service.summary()).toMatchObject({ total: 1, totalFechado: 3000, totalRecebido: 3000, mrr: 200, projecaoDozeMeses: 5400 })
  })

  it('permite follow-up apenas para leads em proposta', () => {
    service.create({ slug: 'lead-b', nome: 'Lead B', nicho: '', cidade: '', nota: null, avaliacoes: 0, email: '', telefone: '', whatsapp: '', siteAntigo: '', motivo: '', urlNova: '', observacoes: '' })

    expect(() => service.recordFollowup('lead-b')).toThrow('Follow-up disponível apenas para leads em proposta')

    service.update('lead-b', { status: 'proposta' })
    expect(service.recordFollowup('lead-b').slug).toBe('lead-b')
  })
})
