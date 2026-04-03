import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  delta?: string | null
  icon: ReactNode
  format?: 'number' | 'currency' | 'percent'
}

export default function MetricCard({ title, value, delta, icon }: Props) {
  const deltaNum = delta ? parseFloat(delta) : null

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{title}</span>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {deltaNum !== null && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${deltaNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {deltaNum >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {deltaNum >= 0 ? '+' : ''}{delta}%
        </div>
      )}
    </div>
  )
}
