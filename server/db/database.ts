import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const defaultDatabasePath = resolve(moduleDirectory, '../../data/search-customers.db')
const databasePath = resolve(process.env.SEARCH_CUSTOMERS_DB ?? defaultDatabasePath)

mkdirSync(dirname(databasePath), { recursive: true })

export const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')

database.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    slug TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    nicho TEXT NOT NULL DEFAULT '',
    cidade TEXT NOT NULL DEFAULT '',
    nota REAL CHECK (nota IS NULL OR (nota >= 0 AND nota <= 5)),
    avaliacoes INTEGER NOT NULL DEFAULT 0 CHECK (avaliacoes >= 0),
    email TEXT NOT NULL DEFAULT '',
    telefone TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    site_antigo TEXT NOT NULL DEFAULT '',
    motivo TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'novo' CHECK (
      status IN ('novo', 'redesenhado', 'publicado', 'proposta', 'respondeu', 'fechado', 'descartado')
    ),
    url_nova TEXT NOT NULL DEFAULT '',
    data_proposta TEXT,
    valor REAL CHECK (valor IS NULL OR valor >= 0),
    observacoes TEXT NOT NULL DEFAULT '',
    contrato_status TEXT NOT NULL DEFAULT 'pendente' CHECK (
      contrato_status IN ('pendente', 'enviado', 'assinado')
    ),
    manutencao REAL NOT NULL DEFAULT 0 CHECK (manutencao >= 0),
    pago INTEGER NOT NULL DEFAULT 0 CHECK (pago IN (0, 1)),
    documento_cliente TEXT NOT NULL DEFAULT '',
    endereco_cliente TEXT NOT NULL DEFAULT '',
    excluido_em TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pipeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_slug TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalhes TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_slug) REFERENCES leads(slug) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_atualizado ON leads(atualizado_em DESC);
  CREATE INDEX IF NOT EXISTS idx_pipeline_lead ON pipeline_events(lead_slug, criado_em DESC);
`)
