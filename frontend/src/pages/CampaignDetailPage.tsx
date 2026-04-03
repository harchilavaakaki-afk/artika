import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Brain } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getCampaign, getCampaignStats, getCampaignKeywords, getCampaignAdGroups, analyzePerformance } from '../api/endpoints'
import { useDateRangeStore } from '../store/dateRangeStore'
import StatusBadge from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)
  const { dateFrom, dateTo } = useDateRangeStore()
  const [tab, setTab] = useState<'stats' | 'keywords' | 'adgroups'>('stats')

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => getCampaign(campaignId),
  })

  const { data: stats } = useQuery({
    queryKey: ['campaignStats', campaignId, dateFrom, dateTo],
    queryFn: () => getCampaignStats(campaignId, dateFrom, dateTo),
  })

  const { data: keywords } = useQuery({
    queryKey: ['campaignKeywords', campaignId],
    queryFn: () => getCampaignKeywords(campaignId),
    enabled: tab === 'keywords',
  })

  const { data: adGroups } = useQuery({
    queryKey: ['campaignAdGroups', campaignId],
    queryFn: () => getCampaignAdGroups(campaignId),
    enabled: tab === 'adgroups',
  })

  const analyzeMutation = useMutation({
    mutationFn: () => analyzePerformance(campaignId),
  })

  if (isLoading) return <LoadingSpinner />
  if (!campaign) return <p className="text-slate-500">Кампания не найдена</p>

  const chartData = (stats || []).map((s) => ({
    date: s.date,
    clicks: s.clicks,
    impressions: s.impressions,
    cost: parseFloat(s.cost),
    conversions: s.conversions,
    ctr: parseFloat(s.ctr),
  }))

  const tabs = [
    { key: 'stats', label: 'Статистика' },
    { key: 'keywords', label: 'Ключевые слова' },
    { key: 'adgroups', label: 'Группы объявлений' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/campaigns" className="text-slate-400 hover:text-slate-200">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{campaign.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge value={campaign.state} />
            <StatusBadge value={campaign.status} />
            <span className="text-xs text-slate-500">ID: {campaign.yandex_id}</span>
          </div>
        </div>
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          <Brain size={16} />
          {analyzeMutation.isPending ? 'Анализ...' : 'AI-анализ'}
        </button>
      </div>

      {analyzeMutation.isSuccess && (
        <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-purple-400 mb-2">{analyzeMutation.data.title}</h3>
          <div className="text-sm text-slate-300 whitespace-pre-wrap max-h-96 overflow-auto">
            {analyzeMutation.data.content}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              tab === t.key
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h3 className="text-sm text-slate-400 mb-4">Расход и клики по дням</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Расход ₽" />
                    <Area type="monotone" dataKey="clicks" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Клики" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h3 className="text-sm text-slate-400 mb-4">Конверсии</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Bar dataKey="conversions" fill="#a855f7" name="Конверсии" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {chartData.length === 0 && (
            <p className="text-slate-500 text-center py-10">Статистика ещё не загружена. Запустите синхронизацию.</p>
          )}
        </div>
      )}

      {/* Keywords tab */}
      {tab === 'keywords' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {keywords && keywords.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="px-5 py-3 font-medium">Ключевое слово</th>
                  <th className="px-5 py-3 font-medium text-right">Ставка</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                  <th className="px-5 py-3 font-medium">Показ</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw: any) => (
                  <tr key={kw.id} className="border-t border-slate-700/50">
                    <td className="px-5 py-3 text-slate-200">{kw.keyword}</td>
                    <td className="px-5 py-3 text-right text-slate-400">
                      {kw.bid ? `${parseFloat(kw.bid).toFixed(2)} ₽` : '—'}
                    </td>
                    <td className="px-5 py-3"><StatusBadge value={kw.status} /></td>
                    <td className="px-5 py-3"><StatusBadge value={kw.serving_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-center py-10">Ключевые слова не найдены</p>
          )}
        </div>
      )}

      {/* Ad groups tab */}
      {tab === 'adgroups' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {adGroups && adGroups.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="px-5 py-3 font-medium">Название</th>
                  <th className="px-5 py-3 font-medium">Yandex ID</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {adGroups.map((ag: any) => (
                  <tr key={ag.id} className="border-t border-slate-700/50">
                    <td className="px-5 py-3 text-slate-200">{ag.name}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{ag.yandex_id}</td>
                    <td className="px-5 py-3"><StatusBadge value={ag.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-center py-10">Группы объявлений не найдены</p>
          )}
        </div>
      )}
    </div>
  )
}
