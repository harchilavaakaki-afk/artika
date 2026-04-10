import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Phone, PhoneIncoming, PhoneForwarded, Users, Clock, TrendingUp,
  Search, Filter, ArrowUpDown, Inbox
} from 'lucide-react'
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

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

// ─── KPI Card ─────────────────────────────────────────────────────────────────

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

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDuration(sec: number) {
  if (!sec) return '0с'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}м ${s}с` : `${s}с`
}

function fmtPhone(phone: string) {
  if (!phone) return '—'
  // mask middle digits
  if (phone.length >= 10) {
    return phone.slice(0, -4).replace(/\d(?=.{4})/g, (_, i) => i > 2 ? '*' : _) + phone.slice(-4)
  }
  return phone
}

// ─── Tab: Обзор ───────────────────────────────────────────────────────────────

function OverviewTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data: daily, isLoading } = useQuery({
    queryKey: ['ctDaily', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/daily', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const { data: sources, isLoading: srcLoading } = useQuery({
    queryKey: ['ctSources', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/sources', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const rows = daily || []
  const srcRows = (sources || []).slice(0, 8)

  return (
    <div className="space-y-5">
      {/* Daily chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Лиды по дням</h3>
        {isLoading ? <div className="h-52 flex items-center justify-center text-slate-500 text-sm animate-pulse">Загрузка...</div>
          : rows.length === 0 ? <div className="text-center py-10 text-slate-500 text-sm">Нет данных</div>
          : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#475569" fontSize={10} width={30} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                <Area type="monotone" dataKey="target_calls" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Целевые звонки" />
                <Area type="monotone" dataKey="requests" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Заявки" />
                <Area type="monotone" dataKey="total_calls" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} name="Все звонки" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source pie */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Звонки по источникам</h3>
          {srcLoading ? <div className="h-40 animate-pulse bg-slate-700/30 rounded" />
            : srcRows.length === 0 ? <div className="text-center py-10 text-slate-500 text-sm">Нет данных</div>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={srcRows}
                    dataKey="total"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fontSize={10}
                  >
                    {srcRows.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Source table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Эффективность источников</h3>
          {srcLoading ? <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-7 bg-slate-700/30 rounded animate-pulse" />)}</div>
            : srcRows.length === 0 ? <div className="text-center py-10 text-slate-500 text-sm">Нет данных</div>
            : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {srcRows.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-300 flex-1 truncate">{s.source}</span>
                    <span className="text-xs text-slate-400">{s.total} зв.</span>
                    <span className="text-xs text-emerald-400">{s.target} цел.</span>
                    <span className="text-xs text-slate-500">{s.conversion}%</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Daily table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-300">Подневная статистика</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Лиды</th>
                <th className="px-4 py-3 font-medium">Целевые звонки</th>
                <th className="px-4 py-3 font-medium">Все звонки</th>
                <th className="px-4 py-3 font-medium">Уникальные</th>
                <th className="px-4 py-3 font-medium">Заявки</th>
                <th className="px-4 py-3 font-medium">Ср. длительность</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Нет данных</td></tr>
              ) : rows.map((r: any) => (
                <tr key={r.date} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-5 py-2.5 text-slate-300">{r.date}</td>
                  <td className="px-4 py-2.5 text-emerald-400 font-bold">{r.leads}</td>
                  <td className="px-4 py-2.5 text-emerald-400">{r.target_calls}</td>
                  <td className="px-4 py-2.5 text-blue-400">{r.total_calls}</td>
                  <td className="px-4 py-2.5 text-slate-400">{r.unique_calls}</td>
                  <td className="px-4 py-2.5 text-purple-400">{r.requests}</td>
                  <td className="px-4 py-2.5 text-slate-400">{fmtDuration(r.avg_duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Журнал звонков ─────────────────────────────────────────────────────

function JournalTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const [search, setSearch] = useState('')
  const [filterTarget, setFilterTarget] = useState<'all' | 'target' | 'nontarget'>('all')
  const [sortField, setSortField] = useState<'date' | 'duration'>('date')

  const { data, isLoading } = useQuery({
    queryKey: ['ctJournal', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/journal', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const rows = useMemo(() => {
    let items = data || []
    if (filterTarget === 'target') items = items.filter((r: any) => r.target)
    if (filterTarget === 'nontarget') items = items.filter((r: any) => !r.target)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((r: any) =>
        r.caller?.toLowerCase().includes(q) ||
        r.source?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.utm_source?.toLowerCase().includes(q) ||
        r.utm_campaign?.toLowerCase().includes(q)
      )
    }
    if (sortField === 'duration') {
      items = [...items].sort((a: any, b: any) => b.duration - a.duration)
    }
    return items
  }, [data, search, filterTarget, sortField])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск: телефон, источник, город..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterTarget}
          onChange={e => setFilterTarget(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="all">Все звонки</option>
          <option value="target">Целевые</option>
          <option value="nontarget">Нецелевые</option>
        </select>
        <select
          value={sortField}
          onChange={e => setSortField(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="date">По дате</option>
          <option value="duration">По длительности</option>
        </select>
        <span className="text-xs text-slate-500">{rows.length} звонков</span>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Длит.</th>
                <th className="px-4 py-3 font-medium">Ожид.</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">UTM Source</th>
                <th className="px-4 py-3 font-medium">UTM Campaign</th>
                <th className="px-4 py-3 font-medium">Город</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">Нет данных</td></tr>
              ) : rows.slice(0, 200).map((r: any, i: number) => (
                <tr key={r.id || i} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap text-xs">{r.date}</td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{fmtPhone(r.caller)}</td>
                  <td className="px-4 py-2.5 text-slate-300">{fmtDuration(r.duration)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.waiting ? fmtDuration(r.waiting) : '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {r.target && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">цел</span>}
                      {r.unique && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">уник</span>}
                      {r.callback && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">обр</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs truncate max-w-32">{r.source || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs truncate max-w-28">{r.utm_source || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs truncate max-w-36">{r.utm_campaign || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{r.city || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 200 && (
          <div className="px-5 py-3 border-t border-slate-700 text-xs text-slate-500 text-center">
            Показано 200 из {rows.length}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Заявки ─────────────────────────────────────────────────────────────

function RequestsTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ctRequests', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/requests', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const rows = data || []

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Заявки с сайта ({rows.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
              <th className="px-5 py-3 font-medium">Дата</th>
              <th className="px-5 py-3 font-medium">Телефон</th>
              <th className="px-5 py-3 font-medium">Источник</th>
              <th className="px-5 py-3 font-medium">UTM</th>
              <th className="px-5 py-3 font-medium">Страница</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Нет заявок за период</td></tr>
            ) : rows.map((r: any, i: number) => (
              <tr key={r.requestId || i} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-5 py-2.5 text-slate-300 text-xs whitespace-nowrap">{r.date || '—'}</td>
                <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{fmtPhone(r.phoneNumber || r.phone || '')}</td>
                <td className="px-5 py-2.5 text-slate-400 text-xs">{r.source || r.utmSource || '—'}</td>
                <td className="px-5 py-2.5 text-slate-400 text-xs truncate max-w-40">{r.utmCampaign || r.utm_campaign || '—'}</td>
                <td className="px-5 py-2.5 text-blue-400 text-xs truncate max-w-52">{r.requestUrl || r.url || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Источники ──────────────────────────────────────────────────────────

function SourcesTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ctSources', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/sources', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const rows = data || []

  return (
    <div className="space-y-5">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Звонки по источникам</h3>
        {isLoading ? <div className="h-48 animate-pulse bg-slate-700/30 rounded" />
          : rows.length === 0 ? <div className="text-center py-10 text-slate-500 text-sm">Нет данных</div>
          : (
            <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 35)}>
              <BarChart data={rows} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis type="category" dataKey="source" stroke="#475569" fontSize={10} width={150} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#3b82f6" name="Все звонки" radius={[0, 4, 4, 0]} />
                <Bar dataKey="target" fill="#10b981" name="Целевые" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
              <th className="px-5 py-3 font-medium">Источник</th>
              <th className="px-4 py-3 font-medium">Всего</th>
              <th className="px-4 py-3 font-medium">Целевые</th>
              <th className="px-4 py-3 font-medium">Уникальные</th>
              <th className="px-4 py-3 font-medium">Конверсия</th>
              <th className="px-4 py-3 font-medium">Ср. длительность</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Нет данных</td></tr>
            ) : rows.map((r: any, i: number) => (
              <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-5 py-3 text-slate-200">{r.source}</td>
                <td className="px-4 py-3 text-blue-400 font-medium">{r.total}</td>
                <td className="px-4 py-3 text-emerald-400 font-medium">{r.target}</td>
                <td className="px-4 py-3 text-slate-400">{r.unique}</td>
                <td className="px-4 py-3">
                  <span className={r.conversion > 70 ? 'text-emerald-400' : r.conversion > 40 ? 'text-yellow-400' : 'text-red-400'}>
                    {r.conversion}%
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{fmtDuration(r.avg_duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'journal' | 'requests' | 'sources'

export default function CalltouchPage() {
  const [rangeDays, setRangeDays] = useState(30)
  const [tab, setTab] = useState<TabId>('overview')

  const { from: dateFrom, to: dateTo } = getDateRange(rangeDays)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['ctSummary', dateFrom, dateTo],
    queryFn: () => api.get('/calltouch/leads', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
  })

  const convRate = summary && summary.total_calls > 0
    ? ((summary.target_calls / summary.total_calls) * 100).toFixed(1) : '—'

  const kpis = [
    { label: 'Всего лидов', value: summary?.leads?.toLocaleString('ru-RU') ?? '—', icon: <TrendingUp size={14} />, color: 'text-emerald-400', sub: 'целевые звонки + заявки' },
    { label: 'Целевые звонки', value: summary?.target_calls?.toLocaleString('ru-RU') ?? '—', icon: <PhoneIncoming size={14} />, color: 'text-emerald-400' },
    { label: 'Всего звонков', value: summary?.total_calls?.toLocaleString('ru-RU') ?? '—', icon: <Phone size={14} />, color: 'text-blue-400' },
    { label: 'Уникальные', value: summary?.unique_calls?.toLocaleString('ru-RU') ?? '—', icon: <Users size={14} />, color: 'text-purple-400' },
    { label: 'Заявки', value: summary?.requests?.toLocaleString('ru-RU') ?? '—', icon: <Inbox size={14} />, color: 'text-violet-400' },
    { label: 'Конверсия', value: `${convRate}%`, icon: <PhoneForwarded size={14} />, color: Number(convRate) > 70 ? 'text-emerald-400' : 'text-yellow-400', sub: 'целевые / все звонки' },
  ]

  const tabs = [
    { id: 'overview' as TabId, label: 'Обзор' },
    { id: 'journal' as TabId, label: 'Журнал звонков' },
    { id: 'requests' as TabId, label: 'Заявки' },
    { id: 'sources' as TabId, label: 'Источники' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Phone className="text-emerald-400" size={22} />
          <h2 className="text-xl font-semibold">Calltouch</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">site: 80119</span>
        </div>

        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                rangeDays === r.days
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          isLoading
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
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-64">
        {tab === 'overview' && <OverviewTab dateFrom={dateFrom} dateTo={dateTo} />}
        {tab === 'journal' && <JournalTab dateFrom={dateFrom} dateTo={dateTo} />}
        {tab === 'requests' && <RequestsTab dateFrom={dateFrom} dateTo={dateTo} />}
        {tab === 'sources' && <SourcesTab dateFrom={dateFrom} dateTo={dateTo} />}
      </div>
    </div>
  )
}
