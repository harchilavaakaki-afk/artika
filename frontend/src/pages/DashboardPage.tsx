import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import api from '../api/client'
import LoadingSpinner from '../components/common/LoadingSpinner'

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 минут

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'connected' | 'pending' | 'not_connected' }) {
  if (status === 'connected')
    return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} /> Подключён</span>
  if (status === 'pending')
    return <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock size={12} /> Ожидание</span>
  return <span className="flex items-center gap-1 text-xs text-slate-500"><AlertCircle size={12} /> Не подключён</span>
}

// ─── Platform cards data ──────────────────────────────────────────────────────

const staticPlatforms = [
  { icon: '📊', label: 'Яндекс Метрика', to: '/metrika', status: 'connected' as const, metric: '5 896 визитов' },
  { icon: '🎯', label: 'Яндекс Директ', to: '/direct', status: 'connected' as const, metric: 'API активен' },
  { icon: '🔍', label: 'Яндекс Вебмастер', to: '/webmaster', status: 'connected' as const, metric: '8 запросов' },
  { icon: '✈️', label: 'Telegram Ads', to: '/telegram', status: 'not_connected' as const, metric: '—' },
  { icon: '📷', label: 'Instagram', to: '/instagram', status: 'not_connected' as const, metric: '—' },
]

// ─── Summary KPI bar ──────────────────────────────────────────────────────────

function SummaryKPIs() {
  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    refetchInterval: REFRESH_INTERVAL,
  })
  const { data: metrikaSummary } = useQuery({
    queryKey: ['metrikaSummaryAll'],
    queryFn: () => api.get('/metrika/summary').then(r => r.data),
    refetchInterval: REFRESH_INTERVAL,
  })
  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => api.get('/analytics/sync-status').then(r => r.data),
    refetchInterval: REFRESH_INTERVAL,
  })

  const kpis = [
    { label: 'Визиты (Метрика)', value: metrikaSummary?.visits?.toLocaleString('ru-RU') ?? '—', sub: `${metrikaSummary?.users?.toLocaleString('ru-RU') ?? '—'} польз.`, color: 'text-blue-400' },
    { label: 'Отказы', value: metrikaSummary?.bounce_rate ? `${metrikaSummary.bounce_rate}%` : '—', sub: 'bounce rate', color: metrikaSummary?.bounce_rate > 50 ? 'text-red-400' : metrikaSummary?.bounce_rate > 35 ? 'text-yellow-400' : 'text-green-400' },
    { label: 'Расход Директ', value: overview?.total_spend ? `${Number(overview.total_spend).toLocaleString('ru-RU')} ₽` : '—', sub: `${overview?.total_clicks?.toLocaleString('ru-RU') ?? '—'} кликов`, color: 'text-yellow-400' },
    { label: 'CTR', value: overview?.avg_ctr ? `${overview.avg_ctr}%` : '—', sub: `CPC: ${overview?.avg_cpc ? `${overview.avg_cpc} ₽` : '—'}`, color: 'text-purple-400' },
    { label: 'Конверсии', value: overview?.total_conversions?.toLocaleString('ru-RU') ?? '—', sub: overview?.avg_cpa ? `CPA: ${overview.avg_cpa} ₽` : 'нет данных', color: 'text-green-400' },
  ]

  const lastSync = syncStatus?.last_sync
    ? new Date(syncStatus.last_sync).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Сводка по всем проектам</span>
        {lastSync && <span className="text-xs text-slate-500">Синхронизировано: {lastSync}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-slate-900/60 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Platform card ────────────────────────────────────────────────────────────

function PlatformCard({
  icon, label, to, status, metric,
}: {
  icon: string
  label: string
  to: string
  status: 'connected' | 'pending' | 'not_connected'
  metric: string
}) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(to)}
      className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 text-left hover:border-slate-500 hover:bg-slate-750 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        <StatusBadge status={status} />
      </div>
      <div>
        <div className="font-medium text-slate-200 text-sm">{label}</div>
        <div className="text-xs text-slate-400 mt-1">{metric}</div>
      </div>
    </button>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  // Live VK status (auto-refreshes every 5 min)
  const { data: vkStatus } = useQuery({
    queryKey: ['vkStatus'],
    queryFn: () => api.get('/vk/status').then(r => r.data),
    refetchInterval: REFRESH_INTERVAL,
  })

  // Auto-trigger VK campaign cache refresh on mount
  useEffect(() => {
    api.post('/vk/trigger-refresh').catch(() => {/* silent */})
  }, [])

  // Auto-trigger Yandex sync on mount (if not synced recently)
  useEffect(() => {
    const lastSync = localStorage.getItem('artika_last_sync')
    const now = Date.now()
    const staleAfter = 30 * 60 * 1000 // 30 минут
    if (!lastSync || now - Number(lastSync) > staleAfter) {
      api.post('/sync/trigger', null, { params: { days_back: 7 } })
        .then(() => localStorage.setItem('artika_last_sync', String(Date.now())))
        .catch(() => {/* silent */})
    }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setLastSyncResult(null)
    try {
      const res = await api.post('/sync/trigger', null, { params: { days_back: 30 } })
      const r = res.data.report || {}
      const errors = r.errors?.join(', ')
      setLastSyncResult(errors ? `Ошибки: ${errors}` : 'Синхронизация завершена')
      localStorage.setItem('artika_last_sync', String(Date.now()))
    } catch (e: any) {
      setLastSyncResult(`Ошибка: ${e.response?.data?.detail || e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const vkCampaignCount = vkStatus?.user?.username?.match(/\d+/)?.[0]
  const vkPlatform = {
    icon: '📘',
    label: 'VK Реклама',
    to: '/vk',
    status: vkStatus?.connected ? 'connected' as const : 'not_connected' as const,
    metric: vkStatus?.connected
      ? (vkCampaignCount ? `${vkCampaignCount} кампаний` : 'Подключено')
      : 'Не подключено',
  }

  const platforms = [...staticPlatforms.slice(0, 3), vkPlatform, ...staticPlatforms.slice(3)]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Дашборд</h2>
        <div className="flex items-center gap-3">
          {lastSyncResult && (
            <span className={`text-xs ${lastSyncResult.startsWith('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>
              {lastSyncResult}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
          >
            {syncing ? '⏳ Синхронизация...' : '🔄 Синхронизировать'}
          </button>
        </div>
      </div>

      <SummaryKPIs />

      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Платформы</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map(p => (
            <PlatformCard key={p.to} {...p} />
          ))}
        </div>
      </div>
    </div>
  )
}
