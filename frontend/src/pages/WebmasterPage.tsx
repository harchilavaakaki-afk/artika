import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Globe, ArrowUpDown, AlertTriangle, CheckCircle, RefreshCw,
  Map, ExternalLink, ChevronRight, X, FileText, RotateCcw
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import api from '../api/client'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebmasterHost {
  host_id: string
  unicode_host_url: string
  verified: boolean
  iks?: number
  pages_count?: number
  in_search_count?: number
  errors_count?: number
}

interface WebmasterQuery {
  id: number
  query_text: string
  date: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  device_type: string
}

interface Sitemap {
  sitemap_id?: string
  url?: string
  [key: string]: any
}

// ─── Host card ────────────────────────────────────────────────────────────────

function HostCard({
  host,
  selected,
  onClick,
}: {
  host: WebmasterHost
  selected: boolean
  onClick: () => void
}) {
  const hasErrors = (host.errors_count ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 bg-slate-800 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-slate-200 truncate">
          {host.unicode_host_url || host.host_id}
        </span>
        {host.verified ? (
          <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">ИКС</div>
          <div className="text-slate-200 font-medium">{host.iks ?? '—'}</div>
        </div>
        <div>
          <div className="text-slate-500">В поиске</div>
          <div className="text-slate-200 font-medium">
            {host.in_search_count?.toLocaleString('ru-RU') ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Проиндексировано</div>
          <div className="text-slate-200 font-medium">
            {host.pages_count?.toLocaleString('ru-RU') ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Ошибки</div>
          <div className={`font-medium ${hasErrors ? 'text-red-400' : 'text-green-400'}`}>
            {host.errors_count ?? 0}
          </div>
        </div>
      </div>
      {selected && (
        <div className="mt-3 flex items-center gap-1 text-xs text-blue-400">
          <ChevronRight size={12} /> Выбран
        </div>
      )}
    </button>
  )
}

// ─── Queries tab ──────────────────────────────────────────────────────────────

function QueriesTab({ hostId }: { hostId: string }) {
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'position' | 'ctr'>('clicks')
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')

  const { data: queries, isLoading } = useQuery({
    queryKey: ['webmasterQueries', hostId],
    queryFn: () =>
      api
        .get<WebmasterQuery[]>('/webmaster/queries', { params: { limit: 500 } })
        .then(r => r.data),
  })

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc)
    else { setSortBy(col); setSortAsc(false) }
  }

  const sorted = [...(queries || [])]
    .filter(q => !search || q.query_text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = (a[sortBy] as number) - (b[sortBy] as number)
      return sortAsc ? diff : -diff
    })

  if (isLoading) return <LoadingSpinner />

  if ((queries || []).length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <Globe size={32} className="mx-auto mb-2 text-slate-600" />
        <p>Нет данных по запросам. Нажмите «Синхронизировать» на дашборде.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Поиск по запросу..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
        <span className="text-sm text-slate-400">{sorted.length} из {(queries || []).length} запросов</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-700">
              <th className="px-5 py-3 font-medium">Запрос</th>
              <th
                className="px-5 py-3 font-medium cursor-pointer hover:text-slate-300 whitespace-nowrap"
                onClick={() => handleSort('impressions')}
              >
                <span className="flex items-center gap-1">Показы <ArrowUpDown size={12} /></span>
              </th>
              <th
                className="px-5 py-3 font-medium cursor-pointer hover:text-slate-300 whitespace-nowrap"
                onClick={() => handleSort('clicks')}
              >
                <span className="flex items-center gap-1">Клики <ArrowUpDown size={12} /></span>
              </th>
              <th
                className="px-5 py-3 font-medium cursor-pointer hover:text-slate-300 whitespace-nowrap"
                onClick={() => handleSort('ctr')}
              >
                <span className="flex items-center gap-1">CTR <ArrowUpDown size={12} /></span>
              </th>
              <th
                className="px-5 py-3 font-medium cursor-pointer hover:text-slate-300 whitespace-nowrap"
                onClick={() => handleSort('position')}
              >
                <span className="flex items-center gap-1">Позиция <ArrowUpDown size={12} /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(q => (
              <tr key={q.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-5 py-3 text-slate-200 max-w-xs truncate">{q.query_text}</td>
                <td className="px-5 py-3 text-slate-400">{q.impressions.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-3 text-slate-300 font-medium">{q.clicks.toLocaleString('ru-RU')}</td>
                <td className="px-5 py-3 text-slate-400">{(q.ctr * 100).toFixed(1)}%</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      q.position <= 3
                        ? 'text-green-400'
                        : q.position <= 10
                        ? 'text-yellow-400'
                        : 'text-slate-400'
                    }
                  >
                    {q.position.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}

// ─── Diagnostics tab ──────────────────────────────────────────────────────────

function DiagnosticsTab({ hostId }: { hostId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['webmasterDiagnostics', hostId],
    queryFn: () =>
      api.get(`/webmaster/hosts/${encodeURIComponent(hostId)}/diagnostics`).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner />
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
        Ошибка загрузки диагностики
      </div>
    )
  }

  const categories = data?.diagnostic_categories || []
  const totalErrors = categories.reduce((s: number, c: any) => s + (c.link_count || 0), 0)

  if (totalErrors === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
        <p className="text-green-400 font-medium">Ошибок не обнаружено</p>
        <p className="text-slate-500 text-sm mt-1">Сайт прошёл диагностику без замечаний</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="text-red-400" size={20} />
        <span className="text-red-400 font-medium">Найдено ошибок: {totalErrors}</span>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-700">
              <th className="px-5 py-3 font-medium">Тип ошибки</th>
              <th className="px-5 py-3 font-medium">Количество</th>
              <th className="px-5 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any, i: number) => (
              <tr key={i} className="border-t border-slate-700/50">
                <td className="px-5 py-3 text-slate-200">{cat.name || cat.diagnostic_category || JSON.stringify(cat)}</td>
                <td className="px-5 py-3 text-red-400 font-medium">{cat.link_count ?? cat.count ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Ошибка</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-400">Полный ответ API</summary>
          <pre className="mt-2 bg-slate-900 rounded p-3 overflow-x-auto text-slate-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

// ─── Recrawl tab ──────────────────────────────────────────────────────────────

function RecrawlTab({ hostId }: { hostId: string }) {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: quota } = useQuery({
    queryKey: ['webmasterRecrawlQuota', hostId],
    queryFn: () =>
      api.get(`/webmaster/hosts/${encodeURIComponent(hostId)}/summary`).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/webmaster/recrawl', { host_id: hostId, url }).then(r => r.data),
    onSuccess: (data) => {
      setResult(`✅ Отправлено. Осталось квоты: ${data.quota_remaining}`)
      setUrl('')
      qc.invalidateQueries({ queryKey: ['webmasterRecrawlQuota', hostId] })
    },
    onError: (e: any) => {
      setResult(`❌ ${e.response?.data?.detail || e.message}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <RotateCcw size={16} /> Переобход URL
        </h4>

        <div className="flex gap-3 mb-4">
          <input
            type="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!url || mutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            {mutation.isPending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>

        {result && (
          <div className={`text-sm p-3 rounded-lg ${
            result.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {result}
          </div>
        )}
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-500">
          Переобход позволяет ускорить индексацию обновлённых страниц. Яндекс обновляет контент
          страницы в течение нескольких часов после добавления в очередь.
        </p>
      </div>
    </div>
  )
}

// ─── Sitemaps tab ─────────────────────────────────────────────────────────────

function SitemapsTab({ hostId }: { hostId: string }) {
  const [newUrl, setNewUrl] = useState('')
  const [addResult, setAddResult] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['webmasterSitemaps', hostId],
    queryFn: () =>
      api.get(`/webmaster/hosts/${encodeURIComponent(hostId)}/sitemaps`).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: () =>
      api.post('/webmaster/sitemaps', { host_id: hostId, sitemap_url: newUrl }).then(r => r.data),
    onSuccess: () => {
      setAddResult('✅ Sitemap добавлен')
      setNewUrl('')
      qc.invalidateQueries({ queryKey: ['webmasterSitemaps', hostId] })
    },
    onError: (e: any) => {
      setAddResult(`❌ ${e.response?.data?.detail || e.message}`)
    },
  })

  if (isLoading) return <LoadingSpinner />

  const sitemaps: Sitemap[] = Array.isArray(data)
    ? data
    : data?.sitemaps || data?.items || []

  return (
    <div className="space-y-4">
      {/* Add sitemap */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <FileText size={16} /> Добавить Sitemap
        </h4>
        <div className="flex gap-3 mb-4">
          <input
            type="url"
            placeholder="https://example.com/sitemap.xml"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!newUrl || addMutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            {addMutation.isPending ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
        {addResult && (
          <div className={`text-sm p-3 rounded-lg ${
            addResult.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {addResult}
          </div>
        )}
      </div>

      {/* Sitemap list */}
      {sitemaps.length > 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <span className="text-sm text-slate-400">{sitemaps.length} sitemap(s)</span>
          </div>
          <div className="divide-y divide-slate-700/50">
            {sitemaps.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-200">{s.url || s.sitemap_id || JSON.stringify(s)}</div>
                  {s.type && <div className="text-xs text-slate-500 mt-0.5">{s.type}</div>}
                </div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <Map size={28} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm">Sitemap-файлы не добавлены</p>
        </div>
      )}
    </div>
  )
}

// ─── Site detail panel ────────────────────────────────────────────────────────

type TabId = 'queries' | 'diagnostics' | 'recrawl' | 'sitemaps'

function SiteDetail({ host, onClose }: { host: WebmasterHost; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>('queries')

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'queries', label: 'Запросы', icon: <ArrowUpDown size={14} /> },
    { id: 'diagnostics', label: 'Диагностика', icon: <AlertTriangle size={14} /> },
    { id: 'recrawl', label: 'Переобход', icon: <RefreshCw size={14} /> },
    { id: 'sitemaps', label: 'Sitemap', icon: <Map size={14} /> },
  ]

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-blue-400" />
          <div>
            <div className="font-medium text-slate-200">{host.unicode_host_url || host.host_id}</div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {host.iks !== undefined && <span>ИКС: <span className="text-slate-300">{host.iks}</span></span>}
              {host.in_search_count !== undefined && <span>В поиске: <span className="text-slate-300">{host.in_search_count?.toLocaleString('ru-RU')}</span></span>}
              {host.errors_count !== undefined && (
                <span className={(host.errors_count ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}>
                  Ошибки: {host.errors_count}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 pt-3">
        {tab === 'queries' && <QueriesTab hostId={host.host_id} />}
        {tab === 'diagnostics' && <DiagnosticsTab hostId={host.host_id} />}
        {tab === 'recrawl' && <RecrawlTab hostId={host.host_id} />}
        {tab === 'sitemaps' && <SitemapsTab hostId={host.host_id} />}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebmasterPage() {
  const [selectedHost, setSelectedHost] = useState<WebmasterHost | null>(null)

  const { data: hosts, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['webmasterHosts'],
    queryFn: () => api.get<WebmasterHost[]>('/webmaster/hosts').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="text-slate-400" size={24} />
          <h2 className="text-xl font-semibold">Яндекс Вебмастер</h2>
          {hosts && (
            <span className="text-sm text-slate-500">({hosts.length} сайтов)</span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-400">
          <AlertTriangle size={18} className="inline mr-2" />
          Ошибка загрузки. Проверьте YANDEX_OAUTH_TOKEN в настройках.
        </div>
      ) : !hosts || hosts.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <Globe size={40} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">Нет подключённых сайтов</h3>
          <p className="text-slate-500 text-sm">
            Добавьте сайт в Яндекс Вебмастер и настройте YANDEX_OAUTH_TOKEN
          </p>
        </div>
      ) : (
        <>
          {/* Sites grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hosts.map(host => (
              <HostCard
                key={host.host_id}
                host={host}
                selected={selectedHost?.host_id === host.host_id}
                onClick={() =>
                  setSelectedHost(prev =>
                    prev?.host_id === host.host_id ? null : host
                  )
                }
              />
            ))}
          </div>

          {/* Site detail */}
          {selectedHost && (
            <SiteDetail
              host={selectedHost}
              onClose={() => setSelectedHost(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
