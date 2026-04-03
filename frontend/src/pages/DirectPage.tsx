import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Target, Clock, Play, Pause, Plus, ChevronRight, ChevronDown,
  BarChart2, MousePointerClick, Eye, TrendingUp, Wallet, Search
} from 'lucide-react'
import { getProjects } from '../api/endpoints'
import api from '../api/client'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: number
  name: string
  status: string
  platform: string
  daily_budget?: number
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  conversions?: number
  project_id?: number
}

// ─── API pending banner ───────────────────────────────────────────────────────

function ApiPendingBanner() {
  return (
    <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 text-yellow-400">
      <Clock size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-medium text-sm">Ожидание активации Яндекс Директ API</div>
        <div className="text-xs text-yellow-500 mt-1">
          Заявка одобрена (app: 6403e4add4594584a94030e97f06848a). Обычно активация занимает 1–3 рабочих дня.
          Данные ниже — из базы после последней синхронизации.
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SERVING: { label: 'Активна', cls: 'bg-green-500/20 text-green-400' },
    ON: { label: 'Активна', cls: 'bg-green-500/20 text-green-400' },
    active: { label: 'Активна', cls: 'bg-green-500/20 text-green-400' },
    STOPPED: { label: 'Остановлена', cls: 'bg-slate-700 text-slate-400' },
    OFF: { label: 'Остановлена', cls: 'bg-slate-700 text-slate-400' },
    paused: { label: 'Пауза', cls: 'bg-slate-700 text-slate-400' },
    PAUSED: { label: 'Пауза', cls: 'bg-slate-700 text-slate-400' },
    ENDED: { label: 'Завершена', cls: 'bg-slate-700 text-slate-500' },
    DRAFT: { label: 'Черновик', cls: 'bg-blue-500/20 text-blue-400' },
    MODERATION: { label: 'Модерация', cls: 'bg-yellow-500/20 text-yellow-400' },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign, projectName, projects }: { campaign: Campaign; projectName?: string; projects: any[] }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: () =>
      api.patch(`/campaigns/${campaign.id}`, {
        status: ['STOPPED', 'paused', 'PAUSED', 'OFF'].includes(campaign.status) ? 'ON' : 'OFF'
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['directCampaigns'] }),
  })

  const assignProjectMutation = useMutation({
    mutationFn: (project_id: number | null) =>
      api.patch(`/campaigns/${campaign.id}`, { project_id }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['directCampaigns'] }),
  })

  const isActive = ['SERVING', 'ON', 'active'].includes(campaign.status)

  return (
    <>
      <tr
        className="border-t border-slate-700/50 hover:bg-slate-700/20 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="px-5 py-3 w-4">
          {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
        </td>
        <td className="px-5 py-3">
          <div className="text-slate-200 text-sm font-medium">{campaign.name}</div>
          {projectName && <div className="text-xs text-slate-500 mt-0.5">{projectName}</div>}
        </td>
        <td className="px-4 py-3"><StatusBadge status={campaign.status} /></td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {campaign.daily_budget ? `${Number(campaign.daily_budget).toLocaleString('ru-RU')} ₽` : '—'}
        </td>
        <td className="px-4 py-3 text-yellow-400 text-sm font-medium">
          {campaign.spend ? `${campaign.spend.toLocaleString('ru-RU')} ₽` : '—'}
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {campaign.impressions?.toLocaleString('ru-RU') ?? '—'}
        </td>
        <td className="px-4 py-3 text-blue-400 text-sm font-medium">
          {campaign.clicks?.toLocaleString('ru-RU') ?? '—'}
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {campaign.ctr ? `${campaign.ctr}%` : '—'}
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {campaign.cpc ? `${campaign.cpc} ₽` : '—'}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <select
              value={campaign.project_id ?? ''}
              onChange={e => assignProjectMutation.mutate(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none max-w-32"
              title="Назначить проект"
            >
              <option value="">— проект</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              title={isActive ? 'Остановить' : 'Запустить'}
              className={`p-1.5 rounded transition-colors ${
                isActive
                  ? 'text-green-400 hover:bg-green-400/10'
                  : 'text-slate-500 hover:bg-slate-600 hover:text-slate-300'
              }`}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={10} className="bg-slate-900/50 border-t border-slate-700/30">
            <CampaignDetail campaignId={campaign.id} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Campaign detail (ad groups + ads) ───────────────────────────────────────

function CampaignDetail({ campaignId }: { campaignId: number }) {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['adGroups', campaignId],
    queryFn: () => api.get('/ad-groups', { params: { campaign_id: campaignId } }).then(r => r.data),
  })

  if (isLoading) return <div className="px-8 py-4 text-slate-500 text-sm">Загрузка групп...</div>
  if (!groups || groups.length === 0) {
    return (
      <div className="px-8 py-4 text-slate-500 text-sm flex items-center gap-2">
        <span>Группы объявлений не найдены</span>
        <span className="text-xs text-yellow-500">(данные появятся после синхронизации с Директ API)</span>
      </div>
    )
  }

  return (
    <div className="px-8 py-4 space-y-3">
      {groups.map((g: any) => (
        <div key={g.id} className="border border-slate-700 rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/60">
            <span className="text-xs font-medium text-slate-300">{g.name}</span>
            <StatusBadge status={g.status || 'DRAFT'} />
          </div>
          <AdsList groupId={g.id} />
        </div>
      ))}
    </div>
  )
}

function AdsList({ groupId }: { groupId: number }) {
  const { data: ads } = useQuery({
    queryKey: ['ads', groupId],
    queryFn: () => api.get('/ads', { params: { ad_group_id: groupId } }).then(r => r.data),
  })

  if (!ads || ads.length === 0) return null

  return (
    <div className="divide-y divide-slate-700/50">
      {ads.map((ad: any) => (
        <div key={ad.id} className="px-4 py-2.5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200 truncate">{ad.title || ad.text || '(без заголовка)'}</div>
            {ad.description && <div className="text-xs text-slate-500 mt-0.5 truncate">{ad.description}</div>}
          </div>
          <StatusBadge status={ad.status || 'DRAFT'} />
        </div>
      ))}
    </div>
  )
}

// ─── Create campaign modal ────────────────────────────────────────────────────

function CreateCampaignModal({ onClose, projects }: { onClose: () => void; projects: any[] }) {
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState<number | ''>(projects[0]?.id ?? '')
  const [budget, setBudget] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/campaigns', {
        name,
        project_id: projectId || null,
        daily_budget: budget ? Number(budget) : null,
        platform: 'yandex_direct',
        status: 'DRAFT',
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['directCampaigns'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-5">Новая кампания</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Название кампании</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Поиск — Москва"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Проект</label>
            <select
              value={projectId}
              onChange={e => setProjectId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Бюджет (₽/день)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="300"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Отмена
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name || mutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
          >
            {mutation.isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats summary ────────────────────────────────────────────────────────────

function StatsSummary({ campaigns }: { campaigns: Campaign[] }) {
  const total = campaigns.length
  const active = campaigns.filter(c => ['SERVING', 'ON', 'active'].includes(c.status)).length
  const totalSpend = campaigns.reduce((s, c) => s + (Number(c.spend) || 0), 0)
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0)
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0)
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '—'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[
        { label: 'Кампаний', value: total, sub: `${active} активных`, icon: <Target size={14} />, color: 'text-slate-200' },
        { label: 'Расход', value: totalSpend ? `${totalSpend.toLocaleString('ru-RU')} ₽` : '—', icon: <Wallet size={14} />, color: 'text-yellow-400' },
        { label: 'Показы', value: totalImpressions.toLocaleString('ru-RU') || '—', icon: <Eye size={14} />, color: 'text-slate-300' },
        { label: 'Клики', value: totalClicks.toLocaleString('ru-RU') || '—', icon: <MousePointerClick size={14} />, color: 'text-blue-400' },
        { label: 'CTR', value: `${avgCtr}%`, icon: <TrendingUp size={14} />, color: 'text-purple-400' },
      ].map(k => (
        <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{k.label}</span>
            <span className={`${k.color} opacity-70`}>{k.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          {k.sub && <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DirectPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState<number | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['directCampaigns'],
    queryFn: () => api.get('/campaigns', { params: { limit: 200 } }).then(r => r.data),
  })

  const allCampaigns: Campaign[] = campaignsData?.campaigns || []

  const filtered = allCampaigns.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterProject !== 'all' && c.project_id !== filterProject) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const projectMap = Object.fromEntries((projects || []).map((p: any) => [p.id, p.name]))

  if (projectsLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Target className="text-yellow-400" size={22} />
          <h2 className="text-xl font-semibold">Яндекс Директ</h2>
          {allCampaigns.length > 0 && (
            <span className="text-sm text-slate-500">({allCampaigns.length} кампаний)</span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} /> Новая кампания
        </button>
      </div>

      {/* Summary KPIs */}
      {allCampaigns.length > 0 && <StatsSummary campaigns={allCampaigns} />}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск кампаний..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="all">Все статусы</option>
          <option value="SERVING">Активные</option>
          <option value="ON">Включены</option>
          <option value="STOPPED">Остановлены</option>
          <option value="PAUSED">На паузе</option>
          <option value="DRAFT">Черновики</option>
        </select>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="all">Все проекты</option>
          {(projects || []).map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Campaigns table */}
      {campaignsLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <BarChart2 size={36} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300 mb-2">
            {allCampaigns.length === 0 ? 'Нет кампаний' : 'Ничего не найдено'}
          </h3>
          <p className="text-slate-500 text-sm">
            {allCampaigns.length === 0
              ? 'После активации API Яндекс Директ кампании появятся автоматически при синхронизации.'
              : 'Попробуйте изменить фильтры поиска.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-left text-xs">
                  <th className="px-5 py-3 w-4" />
                  <th className="px-5 py-3 font-medium">Кампания</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Бюджет</th>
                  <th className="px-4 py-3 font-medium">Расход</th>
                  <th className="px-4 py-3 font-medium">Показы</th>
                  <th className="px-4 py-3 font-medium">Клики</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                  <th className="px-4 py-3 font-medium">CPC</th>
                  <th className="px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <CampaignRow key={c.id} campaign={c} projectName={projectMap[c.project_id || 0]} projects={projects || []} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} projects={projects || []} />
      )}
    </div>
  )
}
