import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  accent?: boolean
}

export const StatCard = ({ label, value, detail, icon: Icon, accent = false }: StatCardProps) => (
  <article className={`rounded-2xl border p-5 shadow-sm ${accent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      </div>
      <span className={`grid size-10 place-items-center rounded-xl ${accent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={19} />
      </span>
    </div>
    <p className="mt-4 text-xs font-medium text-slate-500">{detail}</p>
  </article>
)
