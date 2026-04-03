import { RefreshCw } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { triggerSync } from '../../api/endpoints'
import { useDateRangeStore } from '../../store/dateRangeStore'

export default function Header() {
  const { dateFrom, dateTo, setRange, setPreset } = useDateRangeStore()
  const queryClient = useQueryClient()

  const syncMutation = useMutation({
    mutationFn: () => triggerSync(7),
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })

  return (
    <header className="h-16 border-b border-slate-700 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPreset(d)}
              className="px-3 py-1.5 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            >
              {d}д
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setRange(e.target.value, dateTo)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-300"
          />
          <span>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setRange(dateFrom, e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-300"
          />
        </div>
      </div>

      <button
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
        {syncMutation.isPending ? 'Синхронизация...' : 'Синхронизировать'}
      </button>
    </header>
  )
}
