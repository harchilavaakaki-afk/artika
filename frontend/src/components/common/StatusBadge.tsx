const colors: Record<string, string> = {
  ON: 'bg-green-500/20 text-green-400',
  OFF: 'bg-slate-500/20 text-slate-400',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-400',
  ENDED: 'bg-red-500/20 text-red-400',
  ARCHIVED: 'bg-slate-600/20 text-slate-500',
  ACCEPTED: 'bg-green-500/20 text-green-400',
  DRAFT: 'bg-slate-500/20 text-slate-400',
  MODERATION: 'bg-yellow-500/20 text-yellow-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  RUNNING: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-yellow-500/20 text-yellow-400',
  NEW: 'bg-blue-500/20 text-blue-400',
  VIEWED: 'bg-slate-500/20 text-slate-400',
  APPLIED: 'bg-green-500/20 text-green-400',
  DISMISSED: 'bg-slate-600/20 text-slate-500',
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-slate-500/20 text-slate-400',
}

export default function StatusBadge({ value }: { value: string | null }) {
  if (!value) return null
  const color = colors[value] || 'bg-slate-500/20 text-slate-400'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {value}
    </span>
  )
}
