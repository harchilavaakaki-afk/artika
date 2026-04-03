import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BarChart2, Users, MousePointerClick, Clock, TrendingDown, Monitor, Globe, FileText, Target } from 'lucide-react'
import { getProjects } from '../api/endpoints'
import api from '../api/client'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ─── Date ranges ──────────────────────────────────────────────────────────────

const RANGES = [
  { label: '7 дней', days: 7 },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
]

function getDateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - days)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

// ─── Shared components ────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

function KpiCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`${color} opacity-70`}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function TableEmpty({ text = 'Нет данных' }: { text?: string }) {
  return (
    <div className="text-center py-10 text-slate-500 text-sm">{text}</div>
  )
}

// ─── Tab: Обзор ───────────────────────────────────────────────────────────────

function OverviewTab({ counterId, dateFrom, dateTo }: { counterId: number; dateFrom: string; dateTo: string }) {
  const { data: traffic, isLoading: tLoading } = useQuery({
    queryKey: ['metrikaTraffic', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/traffic', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const { data: sources, isLoading: sLoading } = useQuery({
    queryKey: ['metrikaSources', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/sources', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const rows = traffic?.rows || []
  const sourceRows = (sources?.rows || []).slice(0, 6)

  const sourceLabels: Record<string, string> = {
    organic: 'Поиск',
    direct: 'Прямые',
    referral: 'Переходы',
    ad: 'Реклама',
    social: 'Соцсети',
    internal: 'Внутренние',
    undefined: 'Неизвестно',
  }

  return (
    <div className="space-y-5">
      {/* Traffic chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Посещаемость</h3>
        {tLoading ? <div className="h-52 flex items-center justify-center text-slate-500 text-sm animate-pulse">Загрузка...</div>
          : rows.length === 0 ? <TableEmpty text="Нет данных за период" />
          : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#475569" fontSize={10} width={40} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Визиты" />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Пользователи" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Sources breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Источники трафика</h3>
          {sLoading ? <div className="h-36 animate-pulse bg-slate-700/30 rounded" />
            : sourceRows.length === 0 ? <TableEmpty />
            : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={sourceRows}
                    dataKey="visits"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={({ source, percent }: any) => `${sourceLabels[source] ?? source} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {sourceRows.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    formatter={(v, name) => [Number(v).toLocaleString('ru-RU'), sourceLabels[String(name)] ?? String(name)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Топ источники</h3>
          {sLoading ? <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-7 bg-slate-700/30 rounded animate-pulse" />)}</div>
            : sourceRows.length === 0 ? <TableEmpty />
            : (
              <div className="space-y-2">
                {sourceRows.map((s: any, i: number) => {
                  const total = sourceRows.reduce((a: number, r: any) => a + r.visits, 0)
                  const pct = total > 0 ? Math.round(s.visits / total * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-300 flex-1 truncate">{sourceLabels[s.source] ?? s.source}</span>
                      <span className="text-sm text-slate-400">{s.visits.toLocaleString('ru-RU')}</span>
                      <div className="w-16 bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Источники ───────────────────────────────────────────────────────────

function SourcesTab({ counterId, dateFrom, dateTo }: { counterId: number; dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['metrikaSources', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/sources', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })
  const sourceLabels: Record<string, string> = {
    organic: 'Поиск (органика)', direct: 'Прямые переходы', referral: 'Переходы по ссылкам',
    ad: 'Реклама', social: 'Соцсети', internal: 'Внутренние', undefined: 'Неизвестно',
  }
  const rows = (data?.rows || []).map((r: any) => ({ ...r, label: sourceLabels[r.source] ?? r.source }))

  return (
    <div className="space-y-5">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Визиты по источникам</h3>
        {isLoading ? <div className="h-48 animate-pulse bg-slate-700/30 rounded" />
          : rows.length === 0 ? <TableEmpty />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rows} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis type="category" dataKey="label" stroke="#475569" fontSize={11} width={140} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="visits" fill="#3b82f6" name="Визиты" radius={[0, 4, 4, 0]}>
                  {rows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500 text-left">
              <th className="px-5 py-3 font-medium">Источник</th>
              <th className="px-5 py-3 font-medium">Визиты</th>
              <th className="px-5 py-3 font-medium">Пользователи</th>
              <th className="px-5 py-3 font-medium">Отказы %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Нет данных</td></tr>
            ) : rows.map((r: any, i: number) => (
              <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-5 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-200">{r.label}</span>
                </td>
                <td className="px-5 py-3 text-blue-400 font-medium">{r.visits.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-3 text-slate-400">{r.users.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-3">
                  <span className={r.bounce_rate > 60 ? 'text-red-400' : r.bounce_rate > 40 ? 'text-yellow-400' : 'text-green-400'}>
                    {r.bounce_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Аудитория ───────────────────────────────────────────────────────────

function AudienceTab({ counterId, dateFrom, dateTo }: { counterId: number; dateFrom: string; dateTo: string }) {
  const { data: devData, isLoading: devLoading } = useQuery({
    queryKey: ['metrikaDevices', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/devices', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })
  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['metrikaGeo', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/geo', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const deviceLabels: Record<string, string> = {
    desktop: 'Десктоп', mobile: 'Мобильные', tablet: 'Планшеты'
  }
  const deviceRows = (devData?.rows || []).map((r: any) => ({ ...r, label: deviceLabels[r.device] ?? r.device }))
  const geoRows = geoData?.rows || []
  const geoTotal = geoRows.reduce((s: number, r: any) => s + r.visits, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Devices */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Monitor size={14} /> Устройства
        </h3>
        {devLoading ? <div className="h-48 animate-pulse bg-slate-700/30 rounded" />
          : deviceRows.length === 0 ? <TableEmpty />
          : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={deviceRows} dataKey="visits" nameKey="label" cx="50%" cy="50%" outerRadius={60}>
                    {deviceRows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {deviceRows.map((d: any, i: number) => {
                  const total = deviceRows.reduce((s: number, r: any) => s + r.visits, 0)
                  const pct = total > 0 ? Math.round(d.visits / total * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-sm text-slate-300 flex-1">{d.label}</span>
                      <span className="text-sm text-slate-400">{d.visits.toLocaleString('ru-RU')}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
      </div>

      {/* Geo */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Globe size={14} /> Города
        </h3>
        {geoLoading ? <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-7 bg-slate-700/30 rounded animate-pulse" />)}</div>
          : geoRows.length === 0 ? <TableEmpty />
          : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {geoRows.map((g: any, i: number) => {
                const pct = geoTotal > 0 ? Math.round(g.visits / geoTotal * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                    <span className="text-sm text-slate-300 flex-1 truncate">{g.city || '—'}</span>
                    <div className="w-20 bg-slate-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-slate-400 w-14 text-right">{g.visits.toLocaleString('ru-RU')}</span>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}

// ─── Tab: Содержимое ──────────────────────────────────────────────────────────

function ContentTab({ counterId, dateFrom, dateTo }: { counterId: number; dateFrom: string; dateTo: string }) {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['metrikaPages', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/pages', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo, limit: 50 } }).then(r => r.data),
  })

  const rows = useMemo(() => {
    const all = data?.rows || []
    if (!search) return all
    return all.filter((r: any) => r.url?.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Поиск по URL..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500 text-left">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">Страница</th>
              <th className="px-5 py-3 font-medium">Просмотры</th>
              <th className="px-5 py-3 font-medium">Визиты</th>
              <th className="px-5 py-3 font-medium">Отказы</th>
              <th className="px-5 py-3 font-medium">Время (с)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Нет данных</td></tr>
            ) : rows.map((r: any, i: number) => (
              <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-5 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-5 py-2.5 text-blue-400 max-w-xs truncate font-mono text-xs">{r.url}</td>
                <td className="px-5 py-2.5 text-slate-400">{r.pageviews.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-2.5 text-slate-300">{r.visits.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-2.5">
                  <span className={r.bounce_rate > 60 ? 'text-red-400' : r.bounce_rate > 40 ? 'text-yellow-400' : 'text-green-400'}>
                    {r.bounce_rate}%
                  </span>
                </td>
                <td className="px-5 py-2.5 text-slate-400">{r.avg_duration}с</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Конверсии ───────────────────────────────────────────────────────────

function ConversionsTab({ counterId }: { counterId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['metrikaGoals', counterId],
    queryFn: () => api.get('/metrika/goals-list', { params: { counter_id: counterId } }).then(r => r.data),
  })

  const goals = data?.goals || []
  const typeLabels: Record<string, string> = {
    url: 'URL', action: 'Действие', number: 'Просмотры страниц', step: 'Шаги',
    messenger: 'Мессенджер', cdp: 'CDP', ecommerce: 'Электронная торговля', phone: 'Звонок'
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Цели ({goals.length})</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-500 text-left">
            <th className="px-5 py-3 font-medium">ID</th>
            <th className="px-5 py-3 font-medium">Название</th>
            <th className="px-5 py-3 font-medium">Тип</th>
            <th className="px-5 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
          ) : goals.length === 0 ? (
            <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Нет настроенных целей</td></tr>
          ) : goals.map((g: any) => (
            <tr key={g.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-5 py-3 text-slate-500 font-mono text-xs">{g.id}</td>
              <td className="px-5 py-3 text-slate-200">{g.name}</td>
              <td className="px-5 py-3 text-slate-400">{typeLabels[g.type] ?? g.type}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {g.status === 'Active' ? 'Активна' : g.status || 'Неизвестно'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'sources' | 'audience' | 'content' | 'goals'

export default function MetrikaPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rangeDays, setRangeDays] = useState(30)
  const [tab, setTab] = useState<TabId>('overview')

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const metrikaProjects = (projects || []).filter((p: any) => p.metrika_counter_id)
  const activeId = selectedId ?? metrikaProjects[0]?.id ?? null
  const activeProject = metrikaProjects.find((p: any) => p.id === activeId) ?? null
  const counterId = activeProject?.metrika_counter_id ?? null

  const { from: dateFrom, to: dateTo } = getDateRange(rangeDays)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['metrikaSummary', counterId, dateFrom, dateTo],
    queryFn: () => api.get('/metrika/summary', { params: { counter_id: counterId, date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
    enabled: !!counterId,
  })

  const kpis = [
    { label: 'Визиты', value: summary?.visits?.toLocaleString('ru-RU') ?? '—', icon: <MousePointerClick size={14} />, color: 'text-blue-400' },
    { label: 'Пользователи', value: summary?.users?.toLocaleString('ru-RU') ?? '—', icon: <Users size={14} />, color: 'text-purple-400' },
    { label: 'Отказы', value: summary?.bounce_rate ? `${summary.bounce_rate}%` : '—', icon: <TrendingDown size={14} />, color: summary?.bounce_rate > 50 ? 'text-red-400' : summary?.bounce_rate > 35 ? 'text-yellow-400' : 'text-green-400', sub: 'ниже — лучше' },
    { label: 'Глубина просмотра', value: summary?.page_depth ? `${summary.page_depth} стр.` : '—', icon: <FileText size={14} />, color: 'text-slate-200' },
    { label: 'Время на сайте', value: summary?.avg_duration ? `${Math.floor(summary.avg_duration / 60)}м ${summary.avg_duration % 60}с` : '—', icon: <Clock size={14} />, color: 'text-slate-200' },
  ]

  const tabs = [
    { id: 'overview' as TabId, label: 'Обзор' },
    { id: 'sources' as TabId, label: 'Источники' },
    { id: 'audience' as TabId, label: 'Аудитория' },
    { id: 'content' as TabId, label: 'Содержимое' },
    { id: 'goals' as TabId, label: 'Конверсии' },
  ]

  if (projectsLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 className="text-blue-400" size={22} />
          <h2 className="text-xl font-semibold">Яндекс Метрика</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date range */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  rangeDays === r.days
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Project selector */}
          <select
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            value={activeId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {metrikaProjects.length === 0 && <option value="">Нет проектов</option>}
            {metrikaProjects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!counterId ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center text-slate-500">
          Нет проектов с подключённой Метрикой
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {kpis.map(k => (
              summaryLoading
                ? <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-24 animate-pulse" />
                : <KpiCard key={k.label} {...k} />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-64">
            {tab === 'overview' && <OverviewTab counterId={counterId} dateFrom={dateFrom} dateTo={dateTo} />}
            {tab === 'sources' && <SourcesTab counterId={counterId} dateFrom={dateFrom} dateTo={dateTo} />}
            {tab === 'audience' && <AudienceTab counterId={counterId} dateFrom={dateFrom} dateTo={dateTo} />}
            {tab === 'content' && <ContentTab counterId={counterId} dateFrom={dateFrom} dateTo={dateTo} />}
            {tab === 'goals' && <ConversionsTab counterId={counterId} />}
          </div>
        </>
      )}
    </div>
  )
}
