import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  MessageSquare, Link, Play, Pause, Trash2, Plus, Search,
  ChevronRight, ChevronDown, RefreshCw, AlertTriangle, Eye,
  MousePointerClick, Wallet, TrendingUp, BarChart2, Edit2, FolderOpen
} from 'lucide-react'
import api from '../api/client'
import { getProjects } from '../api/endpoints'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VKCampaign {
  id: number
  name: string
  status: string
  budget_limit: string
  budget_limit_day: string
  start_date?: string
  end_date?: string
  type?: string
}

interface VKAdGroup {
  id: number
  name: string
  status: string
  campaign_id: number
}

interface VKBanner {
  id: number
  name?: string
  status: string
  campaign_id: number
  urls?: { primary: { url: string } }
}

// ─── Date range ───────────────────────────────────────────────────────────────

const RANGES = [
  { label: '7 дней', days: 7 },
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active:   { label: 'Активна',      cls: 'bg-green-500/20 text-green-400' },
    blocked:  { label: 'Остановлена',  cls: 'bg-slate-700 text-slate-400' },
    deleted:  { label: 'Удалена',      cls: 'bg-red-500/20 text-red-400' },
    archived: { label: 'Архив',        cls: 'bg-slate-700 text-slate-500' },
  }
  const c = cfg[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
}

// ─── Not connected screen ─────────────────────────────────────────────────────

function NotConnected({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center max-w-lg mx-auto">
      <MessageSquare size={48} className="text-blue-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Подключите VK Рекламу</h3>
      <p className="text-slate-400 text-sm mb-6">
        Авторизуйтесь через VK чтобы управлять кампаниями прямо из Artika.
        Токен сохранится автоматически.
      </p>
      <div className="space-y-3">
        <a
          href="http://localhost:8000/auth/vk/start"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
        >
          <Link size={16} /> Авторизоваться через VK
        </a>
        <button onClick={onRefresh}
          className="flex items-center justify-center gap-2 w-full px-5 py-2 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl transition-colors text-sm">
          <RefreshCw size={14} /> Проверить соединение
        </button>
      </div>
      <div className="mt-6 text-xs text-slate-500 text-left bg-slate-900 rounded-lg p-4">
        <div className="font-medium text-slate-400 mb-2">Инструкция:</div>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Нажмите «Авторизоваться через VK»</li>
          <li>Войдите в аккаунт VK с вашим рекламным кабинетом</li>
          <li>Разрешите доступ к рекламе</li>
          <li>Вернитесь сюда и нажмите «Проверить соединение»</li>
        </ol>
      </div>
    </div>
  )
}

// ─── Stats summary ────────────────────────────────────────────────────────────

function StatsSummary({ campaigns }: { campaigns: VKCampaign[] }) {
  const active = campaigns.filter(c => c.status === 'active').length
  const totalBudget = campaigns.reduce((s, c) => s + (parseFloat(c.budget_limit_day) || 0), 0)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Кампаний',    value: campaigns.length, sub: `${active} активных`,   color: 'text-slate-200',  icon: <BarChart2 size={14} /> },
        { label: 'Бюджет/день', value: totalBudget ? `${totalBudget.toLocaleString('ru-RU')} ₽` : '—', sub: 'суммарный лимит', color: 'text-yellow-400', icon: <Wallet size={14} /> },
        { label: 'Показы',      value: '—',              sub: 'из статистики API',    color: 'text-slate-400',  icon: <Eye size={14} /> },
        { label: 'Клики',       value: '—',              sub: 'из статистики API',    color: 'text-blue-400',   icon: <MousePointerClick size={14} /> },
      ].map(k => (
        <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{k.label}</span>
            <span className={`${k.color} opacity-70`}>{k.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Create / Edit modals ─────────────────────────────────────────────────────

function CampaignModal({ campaign, onClose }: { campaign?: VKCampaign; onClose: () => void }) {
  const [name, setName] = useState(campaign?.name || '')
  const [budgetDay, setBudgetDay] = useState(campaign?.budget_limit_day || '0')
  const [startDate, setStartDate] = useState(campaign?.start_date || '')
  const [endDate, setEndDate] = useState(campaign?.end_date || '')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => campaign
      ? api.patch(`/vk/campaigns/${campaign.id}`, { name, budget_limit_day: budgetDay }).then(r => r.data)
      : api.post('/vk/campaigns', { name, budget_limit_day: budgetDay, budget_limit: '0', start_date: startDate || null, end_date: endDate || null }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vkCampaigns'] }); onClose() },
    onError: (e: any) => alert(e.response?.data?.detail || e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-5">{campaign ? 'Редактировать кампанию' : 'Новая кампания'}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Название кампании"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Дневной бюджет (₽, 0 = без лимита)</label>
            <input type="number" value={budgetDay} onChange={e => setBudgetDay(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
          {!campaign && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Дата начала</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Дата окончания</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">Отмена</button>
          <button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors">
            {mutation.isPending ? 'Сохранение...' : campaign ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign detail (groups + banners) ──────────────────────────────────────

function CampaignDetail({ campaignId }: { campaignId: number }) {
  const [tab, setTab] = useState<'groups' | 'banners'>('groups')
  const qc = useQueryClient()

  const { data: groups, isLoading: gLoading } = useQuery({
    queryKey: ['vkAdGroups', campaignId],
    queryFn: () => api.get(`/vk/campaigns/${campaignId}/adgroups`).then(r => r.data.items || []),
  })

  const { data: banners, isLoading: bLoading } = useQuery({
    queryKey: ['vkBanners', campaignId],
    queryFn: () => api.get(`/vk/campaigns/${campaignId}/banners`).then(r => r.data.items || []),
  })

  const toggleGroup = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/vk/adgroups/${id}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vkAdGroups', campaignId] }),
  })

  const toggleBanner = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/vk/banners/${id}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vkBanners', campaignId] }),
  })

  const gCount = (groups as VKAdGroup[] || []).length
  const bCount = (banners as VKBanner[] || []).length

  return (
    <div className="px-8 py-4">
      <div className="flex gap-2 mb-3">
        {(['groups', 'banners'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-800'}`}>
            {t === 'groups' ? `Группы объявлений (${gCount})` : `Объявления (${bCount})`}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        gLoading ? <div className="text-slate-500 text-sm py-2">Загрузка...</div>
        : gCount === 0 ? <div className="text-slate-500 text-sm py-2">Нет групп объявлений</div>
        : (
          <div className="space-y-1.5">
            {(groups as VKAdGroup[]).map(g => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                <StatusBadge status={g.status} />
                <span className="text-sm text-slate-200 flex-1">{g.name}</span>
                <span className="text-xs text-slate-500">ID {g.id}</span>
                <button onClick={() => toggleGroup.mutate({ id: g.id, status: g.status === 'active' ? 'blocked' : 'active' })}
                  className={`p-1.5 rounded ${g.status === 'active' ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-500 hover:bg-slate-600 hover:text-slate-300'}`}>
                  {g.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'banners' && (
        bLoading ? <div className="text-slate-500 text-sm py-2">Загрузка...</div>
        : bCount === 0 ? <div className="text-slate-500 text-sm py-2">Нет объявлений</div>
        : (
          <div className="space-y-1.5">
            {(banners as VKBanner[]).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                <StatusBadge status={b.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{b.name || `Баннер #${b.id}`}</div>
                  {b.urls?.primary?.url && <div className="text-xs text-blue-400 truncate">{b.urls.primary.url}</div>}
                </div>
                <span className="text-xs text-slate-500">ID {b.id}</span>
                <button onClick={() => toggleBanner.mutate({ id: b.id, status: b.status === 'active' ? 'blocked' : 'active' })}
                  className={`p-1.5 rounded ${b.status === 'active' ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-500 hover:bg-slate-600 hover:text-slate-300'}`}>
                  {b.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign, projects, onAssign }: {
  campaign: VKCampaign & { project_id?: number | null }
  projects: any[]
  onAssign: (campaignId: number, projectId: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const qc = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.patch(`/vk/campaigns/${campaign.id}`, { status: newStatus }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vkCampaigns'] }),
    onError: (e: any) => alert(e.response?.data?.detail || e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/vk/campaigns/${campaign.id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vkCampaigns'] }),
    onError: (e: any) => alert(e.response?.data?.detail || e.message),
  })

  const isActive = campaign.status === 'active'
  const budgetDay = parseFloat(campaign.budget_limit_day) || 0

  return (
    <>
      <tr className="border-t border-slate-700/50 hover:bg-slate-700/20">
        <td className="px-4 py-3 w-4 cursor-pointer" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
        </td>
        <td className="px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="text-sm font-medium text-slate-200">{campaign.name}</div>
          {campaign.type && <div className="text-xs text-slate-500">{campaign.type}</div>}
        </td>
        <td className="px-4 py-3"><StatusBadge status={campaign.status} /></td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {budgetDay > 0 ? `${budgetDay.toLocaleString('ru-RU')} ₽/д` : '—'}
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {campaign.start_date
            ? `${campaign.start_date}${campaign.end_date ? ` – ${campaign.end_date}` : ''}`
            : '—'}
        </td>
        <td className="px-4 py-3">
          <select
            value={campaign.project_id ?? ''}
            onChange={e => onAssign(campaign.id, e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 max-w-[140px]"
            onClick={e => e.stopPropagation()}
          >
            <option value="">— проект —</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => toggleMutation.mutate(isActive ? 'blocked' : 'active')}
              disabled={toggleMutation.isPending || campaign.status === 'deleted'}
              title={isActive ? 'Остановить' : 'Запустить'}
              className={`p-1.5 rounded transition-colors ${isActive ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-500 hover:bg-slate-600 hover:text-slate-300'} disabled:opacity-30`}>
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => setEditing(true)} title="Редактировать"
              className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors">
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => { if (confirm(`Удалить кампанию «${campaign.name}»?`)) deleteMutation.mutate() }}
              disabled={deleteMutation.isPending || campaign.status === 'deleted'}
              title="Удалить"
              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-slate-900/40 border-t border-slate-700/30">
            <CampaignDetail campaignId={campaign.id} />
          </td>
        </tr>
      )}
      {editing && <CampaignModal campaign={campaign} onClose={() => setEditing(false)} />}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId = 'campaigns' | 'stats'

export default function VKPage() {
  const [mainTab, setMainTab] = useState<TabId>('campaigns')
  const [rangeDays, setRangeDays] = useState(30)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('active_only')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { from: dateFrom, to: dateTo } = getDateRange(rangeDays)

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['vkStatus'],
    queryFn: () => api.get('/vk/status').then(r => r.data),
    refetchInterval: 60_000,
  })

  const vkAccountId: number | undefined = statusData?.user?.id

  // Find which project is linked to this VK account
  const linkedProject = (projects as any[] || []).find((p: any) => p.vk_account_id === vkAccountId)

  const assignProjectMutation = useMutation({
    mutationFn: ({ projectId, prevProjectId }: { projectId: number | null; prevProjectId?: number }) => {
      const calls = []
      if (prevProjectId) {
        calls.push(api.put(`/projects/${prevProjectId}`, { vk_account_id: null }))
      }
      if (projectId) {
        calls.push(api.put(`/projects/${projectId}`, { vk_account_id: vkAccountId }))
      }
      return Promise.all(calls)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const connected = statusData?.connected === true

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['vkCampaigns'],
    queryFn: () => api.get('/vk/campaigns').then(r => r.data),
    enabled: connected,
  })

  const { data: statsData } = useQuery({
    queryKey: ['vkStats', dateFrom, dateTo],
    queryFn: () => api.get('/vk/stats', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => r.data),
    enabled: connected && mainTab === 'stats',
  })

  const assignCampaignMutation = useMutation({
    mutationFn: (payload: Record<string, number | null>) =>
      api.post('/vk/campaign-assignments', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vkCampaigns'] }),
  })

  const allCampaigns: (VKCampaign & { project_id?: number | null })[] = campaignsData?.items || []
  const projectsList: any[] = (projects as any[]) || []

  const filtered = useMemo(() => allCampaigns.filter(c => {
    if (filterStatus === 'active_only' && c.status === 'deleted') return false
    if (filterStatus !== 'all' && filterStatus !== 'active_only' && c.status !== filterStatus) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedProject !== null && c.project_id !== selectedProject) return false
    return true
  }), [allCampaigns, filterStatus, search, selectedProject])

  const chartData = useMemo(() => {
    const items = statsData?.items || []
    const byDate: Record<string, { shows: number; clicks: number; spent: number }> = {}
    items.forEach((item: any) => {
      item.rows?.forEach((row: any) => {
        const d = row.date
        if (!byDate[d]) byDate[d] = { shows: 0, clicks: 0, spent: 0 }
        byDate[d].shows += row.base?.shows || 0
        byDate[d].clicks += row.base?.clicks || 0
        byDate[d].spent += parseFloat(row.base?.spent || '0')
      })
    })
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))
  }, [statsData])

  if (statusLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-blue-400" size={22} />
          <h2 className="text-xl font-semibold">VK Реклама</h2>
          {connected && statusData?.user && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              ✓ {statusData.user.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {connected && (
            <>
              <div className="flex rounded-lg border border-slate-700 overflow-hidden">
                {RANGES.map(r => (
                  <button key={r.days} onClick={() => setRangeDays(r.days)}
                    className={`px-3 py-1.5 text-xs transition-colors ${rangeDays === r.days ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                <Plus size={14} /> Новая кампания
              </button>
            </>
          )}
          <button onClick={() => { refetchStatus(); qc.invalidateQueries({ queryKey: ['vkCampaigns'] }) }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors" title="Обновить">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {!connected && <NotConnected onRefresh={() => refetchStatus()} />}

      {connected && (
        <>
          {/* Account info + project binding */}
          <div className="flex items-center gap-3 flex-wrap bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <MessageSquare size={14} className="text-blue-400" />
              <span className="text-slate-400">Аккаунт:</span>
              <span className="text-slate-200 font-medium">{statusData?.user?.username}</span>
              <span className="text-xs text-slate-500">ID {vkAccountId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusData?.user?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                {statusData?.user?.status}
              </span>
              <a
                href="http://localhost:8000/auth/vk/start"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Войти как другой пользователь"
              >
                Переавторизоваться
              </a>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <FolderOpen size={14} className="text-slate-500" />
              <span className="text-xs text-slate-500">Проект:</span>
              <select
                value={linkedProject?.id ?? ''}
                onChange={e => {
                  const newId = e.target.value ? Number(e.target.value) : null
                  assignProjectMutation.mutate({ projectId: newId, prevProjectId: linkedProject?.id })
                }}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">— не привязан —</option>
                {(projects as any[] || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {assignProjectMutation.isPending && <span className="text-xs text-slate-500">Сохранение...</span>}
            </div>
          </div>

          {/* No campaigns hint */}
          {allCampaigns.length === 0 && !campaignsLoading && (
            <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 text-yellow-400 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Кампании не найдены в текущем аккаунте</div>
                <div className="text-yellow-500 text-xs mt-1">
                  Возможно, ваши кампании находятся в другом аккаунте VK. Нажмите <strong>«Переавторизоваться»</strong> —
                  откроется страница входа myTarget/VK Ads, войдите под своим личным аккаунтом и разрешите доступ.
                  Кампании появятся автоматически.
                </div>
              </div>
            </div>
          )}

          <StatsSummary campaigns={allCampaigns} />

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700">
            {[
              { id: 'campaigns' as TabId, label: `Кампании (${allCampaigns.length})` },
              { id: 'stats' as TabId, label: 'Аналитика' },
            ].map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Campaigns tab */}
          {mainTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Поиск кампаний..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <select value={selectedProject ?? ''} onChange={e => setSelectedProject(e.target.value ? Number(e.target.value) : null)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option value="">Все проекты</option>
                  {projectsList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none">
                  <option value="active_only">Без удалённых</option>
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="blocked">Остановленные</option>
                  <option value="deleted">Удалённые</option>
                </select>
              </div>

              {campaignsLoading ? <LoadingSpinner />
                : filtered.length === 0 ? (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
                    <MessageSquare size={36} className="text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-slate-300 mb-2">
                      {allCampaigns.length === 0 ? 'Нет кампаний' : 'Ничего не найдено'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {allCampaigns.length === 0
                        ? 'Создайте кампанию или проверьте, что авторизованы под нужным аккаунтом VK.'
                        : 'Измените фильтры.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
                          <th className="px-4 py-3 w-4" />
                          <th className="px-4 py-3 font-medium">Кампания</th>
                          <th className="px-4 py-3 font-medium">Статус</th>
                          <th className="px-4 py-3 font-medium">Бюджет/день</th>
                          <th className="px-4 py-3 font-medium">Период</th>
                          <th className="px-4 py-3 font-medium">Проект</th>
                          <th className="px-4 py-3 font-medium">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(c => (
                          <CampaignRow
                            key={c.id}
                            campaign={c}
                            projects={projectsList}
                            onAssign={(campaignId, projectId) =>
                              assignCampaignMutation.mutate({ [String(campaignId)]: projectId })
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {/* Stats tab */}
          {mainTab === 'stats' && (
            statsLoading ? <LoadingSpinner />
            : chartData.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
                <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-3" />
                <p className="text-slate-400">Нет данных за выбранный период</p>
                <p className="text-slate-500 text-sm mt-1">Статистика доступна только для кампаний с показами</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Показы и клики</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={d => d.slice(5)} />
                      <YAxis stroke="#475569" fontSize={10} width={40} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="shows" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Показы" />
                      <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Клики" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Расход (₽)</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={d => d.slice(5)} />
                      <YAxis stroke="#475569" fontSize={10} width={50} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Расход']} />
                      <Bar dataKey="spent" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Расход" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}
        </>
      )}

      {showCreate && <CampaignModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
