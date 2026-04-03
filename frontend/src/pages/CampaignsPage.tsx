import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCampaigns } from '../api/endpoints'
import { useProjectStore } from '../store/projectStore'
import StatusBadge from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function CampaignsPage() {
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId)

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', selectedProjectId],
    queryFn: () => getCampaigns({ project_id: selectedProjectId || undefined }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Кампании</h2>
        <span className="text-sm text-slate-500">Всего: {data?.total || 0}</span>
      </div>

      {data && data.campaigns.length > 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-700">
                <th className="px-5 py-3 font-medium">Название</th>
                <th className="px-5 py-3 font-medium">Yandex ID</th>
                <th className="px-5 py-3 font-medium">Тип</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Состояние</th>
                <th className="px-5 py-3 font-medium">Стратегия</th>
                <th className="px-5 py-3 font-medium text-right">Бюджет/день</th>
                <th className="px-5 py-3 font-medium">Начало</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/campaigns/${c.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{c.yandex_id}</td>
                  <td className="px-5 py-3 text-slate-400">{c.type || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-5 py-3"><StatusBadge value={c.state} /></td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{c.strategy_type || '—'}</td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    {c.daily_budget ? `${parseFloat(c.daily_budget).toLocaleString('ru-RU')} ₽` : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{c.start_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <p className="text-slate-500">Кампании не найдены. Синхронизируйте данные из Яндекс Директ.</p>
        </div>
      )}
    </div>
  )
}
