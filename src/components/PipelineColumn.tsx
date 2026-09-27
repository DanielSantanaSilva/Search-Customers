import type { Lead, LeadStatus } from '../types/lead'
import { LeadCard } from './LeadCard'

interface PipelineColumnProps {
  title: string
  status: LeadStatus
  leads: Lead[]
  color: string
  updatingSlug?: string
  onStatusChange: (lead: Lead, status: LeadStatus) => void
}

export const PipelineColumn = ({ title, status, leads, color, updatingSlug, onStatusChange }: PipelineColumnProps) => (
  <section className="min-w-72 flex-1 rounded-2xl bg-slate-100/70 p-3" data-status={status}>
    <header className="mb-3 flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${color}`} />
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">{leads.length}</span>
    </header>
    <div className="space-y-3">
      {leads.length > 0 ? leads.map((lead) => <LeadCard key={lead.slug} lead={lead} updating={updatingSlug === lead.slug} onStatusChange={onStatusChange} />) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-400">Nenhum lead nesta etapa</div>
      )}
    </div>
  </section>
)
