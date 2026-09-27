import { ExternalLink, Mail, MapPin, Star } from 'lucide-react'
import type { Lead } from '../types/lead'
import { formatDate } from '../lib/format'

interface LeadCardProps {
  lead: Lead
}

export const LeadCard = ({ lead }: LeadCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-slate-950">{lead.nome}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} /> {lead.cidade || 'Cidade não informada'}
        </p>
      </div>
      {lead.nota !== null && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
          <Star size={11} fill="currentColor" /> {lead.nota.toFixed(1)}
        </span>
      )}
    </div>

    <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
      {lead.motivo || `${lead.nicho || 'Negócio local'} com potencial para uma presença digital melhor.`}
    </p>

    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
      <time className="text-xs text-slate-400">Atualizado {formatDate(lead.atualizadoEm)}</time>
      <div className="flex gap-1">
        {lead.email && (
          <a className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" href={`mailto:${lead.email}`} aria-label={`Enviar e-mail para ${lead.nome}`}>
            <Mail size={15} />
          </a>
        )}
        {(lead.urlNova || lead.siteAntigo) && (
          <a className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" href={lead.urlNova || lead.siteAntigo} target="_blank" rel="noreferrer" aria-label={`Abrir site de ${lead.nome}`}>
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  </article>
)
