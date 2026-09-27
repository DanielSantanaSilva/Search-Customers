import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PipelineColumn } from './components/PipelineColumn'
import { StatCard } from './components/StatCard'
import { api } from './lib/api'
import { formatCurrency } from './lib/format'
import type { DashboardSummary, Lead, LeadStatus } from './types/lead'

const pipeline: { status: LeadStatus; title: string; color: string }[] = [
  { status: 'novo', title: 'Novos', color: 'bg-sky-500' },
  { status: 'redesenhado', title: 'Redesenhados', color: 'bg-violet-500' },
  { status: 'publicado', title: 'Publicados', color: 'bg-amber-500' },
  { status: 'proposta', title: 'Propostas', color: 'bg-orange-500' },
  { status: 'respondeu', title: 'Responderam', color: 'bg-cyan-500' },
  { status: 'fechado', title: 'Fechados', color: 'bg-emerald-500' },
]

const navItems = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Pipeline', icon: Target, active: true },
  { label: 'Clientes', icon: Users },
  { label: 'Sites', icon: BriefcaseBusiness },
  { label: 'Follow-ups', icon: Bell },
  { label: 'Contratos', icon: FileText },
  { label: 'Financeiro', icon: WalletCards },
]

function App() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.listLeads(), api.summary()])
      .then(([leadData, summaryData]) => {
        setLeads(leadData)
        setSummary(summaryData)
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return leads
    return leads.filter((lead) =>
      [lead.nome, lead.nicho, lead.cidade, lead.email].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(term),
      ),
    )
  }, [leads, search])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-950 px-4 py-6 text-slate-300 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-slate-950"><Search size={20} strokeWidth={3} /></span>
            <div><p className="font-bold text-white">Search Customers</p><p className="text-xs text-slate-500">Prospector inteligente</p></div>
          </div>
          <button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>

        <nav className="mt-10 space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button key={label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-emerald-500 text-slate-950' : 'hover:bg-slate-900 hover:text-white'}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-5">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-900 hover:text-white"><Settings size={18} /> Configurações</button>
          <div className="mt-4 flex items-center gap-3 border-t border-slate-800 px-2 pt-4">
            <span className="grid size-9 place-items-center rounded-full bg-slate-800 text-xs font-bold text-emerald-400">SC</span>
            <div><p className="text-sm font-semibold text-white">Seu workspace</p><p className="text-xs text-slate-500">Antigravity Plugin</p></div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button>
            <div><h1 className="text-lg font-bold">Pipeline de prospecção</h1><p className="hidden text-xs text-slate-500 sm:block">Acompanhe cada oportunidade até o fechamento</p></div>
          </div>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" placeholder="Buscar leads..." />
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="mb-6 sm:hidden"><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Buscar leads..." /></div>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Leads ativos" value={String(summary?.total ?? 0)} detail={`${summary?.porStatus.proposta ?? 0} propostas em andamento`} icon={Users} />
            <StatCard label="Taxa de resposta" value={summary && summary.total > 0 ? `${Math.round(((summary.porStatus.respondeu + summary.porStatus.fechado) / summary.total) * 100)}%` : '0%'} detail="Contatos que avançaram" icon={BarChart3} />
            <StatCard label="Receita fechada" value={formatCurrency(summary?.totalFechado ?? 0)} detail={`${formatCurrency(summary?.aReceber ?? 0)} a receber`} icon={CircleDollarSign} accent />
            <StatCard label="Receita recorrente" value={formatCurrency(summary?.mrr ?? 0)} detail="MRR de manutenções" icon={Sparkles} />
          </section>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}. Inicie a API com <code>npm run dev</code>.</div>}

          {loading ? (
            <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Carregando pipeline...</div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-max gap-4 xl:min-w-0">
                {pipeline.map((column) => (
                  <PipelineColumn key={column.status} {...column} leads={visibleLeads.filter((lead) => lead.status === column.status)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
