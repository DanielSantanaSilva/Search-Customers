import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PipelineColumn } from './components/PipelineColumn'
import { StatCard } from './components/StatCard'
import { api } from './lib/api'
import { formatCurrency, formatDate } from './lib/format'
import type { DashboardSummary, Lead, LeadStatus } from './types/lead'

const pipeline: { status: LeadStatus; title: string; color: string }[] = [
  { status: 'novo', title: 'Novos', color: 'bg-sky-500' },
  { status: 'redesenhado', title: 'Redesenhados', color: 'bg-violet-500' },
  { status: 'publicado', title: 'Publicados', color: 'bg-amber-500' },
  { status: 'proposta', title: 'Propostas', color: 'bg-orange-500' },
  { status: 'respondeu', title: 'Responderam', color: 'bg-cyan-500' },
  { status: 'fechado', title: 'Fechados', color: 'bg-emerald-500' },
  { status: 'descartado', title: 'Descartados', color: 'bg-slate-500' },
]

type Section = 'overview' | 'pipeline' | 'customers' | 'sites' | 'followups' | 'contracts' | 'finance'

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Target },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'sites', label: 'Sites', icon: BriefcaseBusiness },
  { id: 'followups', label: 'Follow-ups', icon: Bell },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'finance', label: 'Financeiro', icon: WalletCards },
]

const sectionDescriptions: Record<Section, string> = {
  overview: 'Indicadores e atividades do seu negócio',
  pipeline: 'Acompanhe cada oportunidade até o fechamento',
  customers: 'Consulte contatos e dados dos clientes',
  sites: 'Acompanhe sites atuais, redesigns e publicações',
  followups: 'Retome propostas que aguardam uma resposta',
  contracts: 'Acompanhe a formalização de cada projeto',
  finance: 'Controle valores recebidos e receitas recorrentes',
}

const statusLabels: Record<LeadStatus, string> = {
  novo: 'Novo',
  redesenhado: 'Redesenhado',
  publicado: 'Publicado',
  proposta: 'Proposta',
  respondeu: 'Respondeu',
  fechado: 'Fechado',
  descartado: 'Descartado',
}

const contractLabels: Record<Lead['contratoStatus'], string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  assinado: 'Assinado',
}

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">{children}</div>
)

const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>
)

function App() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [followups, setFollowups] = useState<Lead[]>([])
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionSlug, setActionSlug] = useState('')
  const [updatingStatusSlug, setUpdatingStatusSlug] = useState('')

  const loadData = async () => {
    const [leadData, summaryData] = await Promise.all([api.listLeads(), api.summary()])
    setLeads(leadData)
    setSummary(summaryData)
  }

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
      [lead.nome, lead.nicho, lead.cidade, lead.email].some((value) => value.toLocaleLowerCase('pt-BR').includes(term)),
    )
  }, [leads, search])

  const activeLeads = leads.filter((lead) => lead.status !== 'descartado')
  const visibleActiveLeads = visibleLeads.filter((lead) => lead.status !== 'descartado')
  const customers = visibleLeads.filter((lead) => lead.status === 'fechado')
  const contractLeads = visibleLeads.filter((lead) => lead.status !== 'novo' && lead.status !== 'descartado')
  const visibleFollowups = followups.filter((lead) => visibleLeads.some((item) => item.slug === lead.slug))

  const selectSection = (section: Section) => {
    setActiveSection(section)
    setMenuOpen(false)
    setError('')

    if (section === 'followups') {
      setFollowupsLoading(true)
      api.listFollowups()
        .then(setFollowups)
        .catch((requestError: Error) => setError(requestError.message))
        .finally(() => setFollowupsLoading(false))
    }
  }

  const changeStatus = async (lead: Lead, status: LeadStatus) => {
    if (status === lead.status || updatingStatusSlug) return

    setUpdatingStatusSlug(lead.slug)
    setError('')
    try {
      const updatedLead = await api.updateStatus(lead.slug, status)
      setLeads((current) => current.map((item) => item.slug === updatedLead.slug ? updatedLead : item))
      setSummary(await api.summary())
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setUpdatingStatusSlug('')
    }
  }

  const markFollowup = async (lead: Lead) => {
    setActionSlug(lead.slug)
    setError('')
    try {
      await api.recordFollowup(lead.slug, 'Follow-up registrado pelo dashboard')
      setFollowups((current) => current.filter((item) => item.slug !== lead.slug))
      await loadData()
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setActionSlug('')
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads ativos" value={String(activeLeads.length)} detail={`${summary?.porStatus.proposta ?? 0} propostas em andamento`} icon={Users} />
        <StatCard label="Taxa de resposta" value={activeLeads.length > 0 ? `${Math.round((((summary?.porStatus.respondeu ?? 0) + (summary?.porStatus.fechado ?? 0)) / activeLeads.length) * 100)}%` : '0%'} detail="Contatos que avançaram" icon={BarChart3} />
        <StatCard label="Receita fechada" value={formatCurrency(summary?.totalFechado ?? 0)} detail={`${formatCurrency(summary?.aReceber ?? 0)} a receber`} icon={CircleDollarSign} accent />
        <StatCard label="Follow-ups" value={String(summary?.followupsPendentes ?? 0)} detail="Propostas aguardando contato" icon={Bell} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Distribuição do pipeline</h2>
          <div className="mt-5 space-y-4">
            {pipeline.map((item) => {
              const count = summary?.porStatus[item.status] ?? 0
              const width = activeLeads.length > 0 ? Math.max((count / activeLeads.length) * 100, count > 0 ? 4 : 0) : 0
              return <div key={item.status}><div className="mb-1.5 flex justify-between text-sm"><span>{item.title}</span><strong>{count}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} /></div></div>
            })}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Atualizações recentes</h2>
          <div className="mt-4 space-y-3">
            {visibleActiveLeads.slice(0, 5).map((lead) => <button key={lead.slug} onClick={() => selectSection('pipeline')} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100"><div><p className="text-sm font-semibold">{lead.nome}</p><p className="text-xs text-slate-500">{statusLabels[lead.status]}</p></div><time className="text-xs text-slate-400">{formatDate(lead.atualizadoEm)}</time></button>)}
            {visibleActiveLeads.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhuma atividade registrada.</p>}
          </div>
        </section>
      </div>
    </div>
  )

  const renderPipeline = () => (
    <div className="overflow-x-auto pb-4"><div className="flex min-w-max gap-4 xl:min-w-0">{pipeline.map((column) => <PipelineColumn key={column.status} {...column} leads={visibleLeads.filter((lead) => lead.status === column.status)} updatingSlug={updatingStatusSlug} onStatusChange={(lead, status) => void changeStatus(lead, status)} />)}</div></div>
  )

  const renderCustomers = () => customers.length === 0 ? <EmptyState>Nenhum cliente fechado. Os leads aparecem aqui quando chegam à etapa “Fechado”.</EmptyState> : (
    <TableShell><table className="w-full min-w-200 text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Cliente</th><th className="p-4">Contato</th><th className="p-4">Localização</th><th className="p-4">Projeto</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{customers.map((lead) => <tr key={lead.slug}><td className="p-4"><strong>{lead.nome}</strong><p className="text-xs text-slate-500">{lead.nicho || 'Nicho não informado'}</p></td><td className="p-4"><p>{lead.email || 'Sem e-mail'}</p><p className="text-xs text-slate-500">{lead.whatsapp || lead.telefone || 'Sem telefone'}</p></td><td className="p-4">{lead.cidade || 'Não informada'}</td><td className="p-4">{formatCurrency(lead.valor ?? 0)}<p className="text-xs text-slate-500">{formatCurrency(lead.manutencao)}/mês</p></td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.pago ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{lead.pago ? 'Pago' : 'A receber'}</span></td></tr>)}</tbody></table></TableShell>
  )

  const renderSites = () => visibleLeads.length === 0 ? <EmptyState>Nenhum site cadastrado.</EmptyState> : (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleLeads.map((lead) => <article key={lead.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{lead.nome}</h2><p className="text-sm text-slate-500">{lead.nicho || 'Negócio local'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{statusLabels[lead.status]}</span></div><div className="mt-5 space-y-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-400">Site original</p>{lead.siteAntigo ? <a href={lead.siteAntigo} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-sm text-sky-700 hover:underline">Abrir site <ExternalLink size={13} /></a> : <p className="mt-1 text-sm text-slate-500">Não informado</p>}</div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase text-emerald-600">Nova versão</p>{lead.urlNova ? <a href={lead.urlNova} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-sm font-medium text-emerald-700 hover:underline">Abrir redesign <ExternalLink size={13} /></a> : <p className="mt-1 text-sm text-emerald-700/70">Ainda não publicada</p>}</div></div></article>)}</div>
  )

  const renderFollowups = () => followupsLoading ? <EmptyState>Carregando follow-ups...</EmptyState> : visibleFollowups.length === 0 ? <EmptyState>{search.trim() ? `Nenhum follow-up encontrado para “${search.trim()}”.` : 'Nenhum follow-up pendente há mais de três dias.'}</EmptyState> : (
    <div className="space-y-4">{visibleFollowups.map((lead) => <article key={lead.slug} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold">{lead.nome}</h2><span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">Proposta enviada</span></div><p className="mt-1 text-sm text-slate-500">{lead.dataProposta ? `Desde ${formatDate(lead.dataProposta)}` : 'Data não informada'} · {formatCurrency(lead.valor ?? 0)}</p></div><div className="flex gap-2">{lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"><Mail size={16} /> Contatar</a>}<button disabled={Boolean(actionSlug)} onClick={() => void markFollowup(lead)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"><CheckCircle2 size={16} /> Registrar</button></div></article>)}</div>
  )

  const renderContracts = () => contractLeads.length === 0 ? <EmptyState>Nenhum lead está pronto para formalização.</EmptyState> : (
    <TableShell><table className="w-full min-w-180 text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Cliente</th><th className="p-4">Etapa</th><th className="p-4">Contrato</th><th className="p-4">Valor</th><th className="p-4">Dados</th></tr></thead><tbody className="divide-y divide-slate-100">{contractLeads.map((lead) => <tr key={lead.slug}><td className="p-4"><strong>{lead.nome}</strong><p className="text-xs text-slate-500">{lead.email || 'Sem e-mail'}</p></td><td className="p-4">{statusLabels[lead.status]}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.contratoStatus === 'assinado' ? 'bg-emerald-50 text-emerald-700' : lead.contratoStatus === 'enviado' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>{contractLabels[lead.contratoStatus]}</span></td><td className="p-4">{formatCurrency(lead.valor ?? 0)}</td><td className="p-4 text-xs text-slate-500">{lead.documentoCliente ? 'Documento cadastrado' : 'Documento pendente'}<br />{lead.enderecoCliente ? 'Endereço cadastrado' : 'Endereço pendente'}</td></tr>)}</tbody></table></TableShell>
  )

  const renderFinance = () => {
    const closed = visibleLeads.filter((lead) => lead.status === 'fechado')
    return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Receita fechada" value={formatCurrency(summary?.totalFechado ?? 0)} detail="Total contratado" icon={CircleDollarSign} accent /><StatCard label="Recebido" value={formatCurrency(summary?.totalRecebido ?? 0)} detail="Projetos quitados" icon={CheckCircle2} /><StatCard label="A receber" value={formatCurrency(summary?.aReceber ?? 0)} detail="Saldo dos contratos" icon={WalletCards} /><StatCard label="Projeção 12 meses" value={formatCurrency(summary?.projecaoDozeMeses ?? 0)} detail={`${formatCurrency(summary?.mrr ?? 0)} de MRR`} icon={Sparkles} /></section>{closed.length === 0 ? <EmptyState>Nenhum projeto fechado para exibir no financeiro.</EmptyState> : <TableShell><table className="w-full min-w-180 text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Cliente</th><th className="p-4">Projeto</th><th className="p-4">Manutenção</th><th className="p-4">Situação</th><th className="p-4">Projeção anual</th></tr></thead><tbody className="divide-y divide-slate-100">{closed.map((lead) => <tr key={lead.slug}><td className="p-4 font-semibold">{lead.nome}</td><td className="p-4">{formatCurrency(lead.valor ?? 0)}</td><td className="p-4">{formatCurrency(lead.manutencao)}/mês</td><td className="p-4">{lead.pago ? 'Recebido' : 'A receber'}</td><td className="p-4 font-semibold">{formatCurrency((lead.valor ?? 0) + lead.manutencao * 12)}</td></tr>)}</tbody></table></TableShell>}</div>
  }

  const sectionContent: Record<Section, () => ReactNode> = { overview: renderOverview, pipeline: renderPipeline, customers: renderCustomers, sites: renderSites, followups: renderFollowups, contracts: renderContracts, finance: renderFinance }
  const activeItem = navItems.find((item) => item.id === activeSection) ?? navItems[0]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-950 px-4 py-6 text-slate-300 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-slate-950"><Search size={20} strokeWidth={3} /></span><div><p className="font-bold text-white">Search Customers</p><p className="text-xs text-slate-500">Prospector inteligente</p></div></div><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
        <nav className="mt-10 space-y-1">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => selectSection(id)} aria-current={activeSection === id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeSection === id ? 'bg-emerald-500 text-slate-950' : 'hover:bg-slate-900 hover:text-white'}`}><Icon size={18} /> {label}</button>)}</nav>
        <div className="absolute inset-x-4 bottom-5"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500" disabled><Settings size={18} /> Configurações</button><div className="mt-4 flex items-center gap-3 border-t border-slate-800 px-2 pt-4"><span className="grid size-9 place-items-center rounded-full bg-slate-800 text-xs font-bold text-emerald-400">SC</span><div><p className="text-sm font-semibold text-white">Seu workspace</p><p className="text-xs text-slate-500">Antigravity Plugin</p></div></div></div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
      <main className="lg:pl-64"><header className="sticky top-0 z-20 flex min-h-18 items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div><h1 className="text-lg font-bold">{activeItem.label}</h1><p className="hidden text-xs text-slate-500 sm:block">{sectionDescriptions[activeSection]}</p></div></div><div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar leads" className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" placeholder="Buscar leads..." /></div></header>
        <div className="p-4 md:p-8"><div className="mb-6 sm:hidden"><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar leads" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Buscar leads..." /></div>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}. Verifique se a API está ativa.</div>}{loading ? <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Carregando CRM...</div> : sectionContent[activeSection]()}</div>
      </main>
    </div>
  )
}

export default App
