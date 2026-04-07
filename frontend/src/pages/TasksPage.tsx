import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Bug,
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { getProjects, getProjectTasks, getTaskSummary, createProjectTask, updateProjectTask, deleteProjectTask } from '../api/endpoints'
import type { ProjectTask } from '../types/api'

type Status = 'done' | 'partial' | 'not_started' | 'bug'

const statusConfig: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Готово' },
  partial: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Частично' },
  not_started: { icon: Circle, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Не начато' },
  bug: { icon: Bug, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Баг' },
}

const statusCycle: Status[] = ['not_started', 'partial', 'done', 'bug']

function StatusBadge({ status, onClick }: { status: Status; onClick?: () => void }) {
  const cfg = statusConfig[status] ?? statusConfig['not_started']
  const Icon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg} hover:opacity-80 transition-opacity`}
      title="Клик — сменить статус"
    >
      <Icon size={14} />
      {cfg.label}
    </button>
  )
}

function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task?: ProjectTask | null
  onClose: () => void
  onSave: (data: Partial<ProjectTask>) => void
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [category, setCategory] = useState(task?.category || '')
  const [status, setStatus] = useState<Status>((task?.status as Status) || 'not_started')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="font-semibold text-lg">{task ? 'Редактировать' : 'Новая задача'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Название</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
              placeholder="Подробности..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Категория</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Напр.: Лендинг, Реклама"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="not_started">Не начато</option>
                <option value="partial">Частично</option>
                <option value="done">Готово</option>
                <option value="bug">Баг</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Отмена</button>
          <button
            onClick={() => { if (title.trim()) onSave({ title: title.trim(), description: description.trim() || null, category: category.trim() || null, status }) }}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {task ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<number | null>(null)
  const [modal, setModal] = useState<{ open: boolean; task?: ProjectTask | null }>({ open: false })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const { data: allProjects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })
  const projects = allProjects?.filter((p) => !p.name.startsWith('_'))

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => getProjectTasks(projectId!),
    enabled: !!projectId,
  })

  const { data: summary } = useQuery({
    queryKey: ['task-summary', projectId],
    queryFn: () => getTaskSummary(projectId!),
    enabled: !!projectId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] })
    queryClient.invalidateQueries({ queryKey: ['task-summary', projectId] })
  }

  const createMut = useMutation({
    mutationFn: (data: Partial<ProjectTask>) => createProjectTask(projectId!, data),
    onSuccess: invalidate,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectTask> }) => updateProjectTask(projectId!, id, data),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProjectTask(projectId!, id),
    onSuccess: invalidate,
  })

  const cycleStatus = (task: ProjectTask) => {
    const idx = statusCycle.indexOf(task.status)
    const next = statusCycle[(idx + 1) % statusCycle.length]
    updateMut.mutate({ id: task.id, data: { status: next } })
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Group tasks by category
  const grouped = (tasks || []).reduce<Record<string, ProjectTask[]>>((acc, t) => {
    const cat = t.category || 'Без категории'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  // Auto-select first project
  useEffect(() => {
    if (projects?.length && !projectId) {
      setProjectId(projects[0].id)
    }
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Задачи проекта</h1>
        <div className="flex items-center gap-3">
          {/* Project selector */}
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {!projects?.length && <option value="">Загрузка...</option>}
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {projectId && (
            <button
              onClick={() => setModal({ open: true })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Добавить
            </button>
          )}
        </div>
      </div>

      {!projectId && (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center text-slate-500">
          Выберите проект для просмотра задач
        </div>
      )}

      {projectId && summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Всего</p>
              <p className="text-3xl font-bold mt-1">{summary.total}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-emerald-800/50">
              <p className="text-xs text-emerald-400 uppercase tracking-wide">Готово</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{summary.done}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-yellow-800/50">
              <p className="text-xs text-yellow-400 uppercase tracking-wide">Частично</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{summary.partial}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-600">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Не начато</p>
              <p className="text-3xl font-bold text-slate-400 mt-1">{summary.not_started}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-red-800/50">
              <p className="text-xs text-red-400 uppercase tracking-wide">Баги</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{summary.bug}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Прогресс</span>
              <span className="text-blue-400 font-medium">{summary.percent}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
                style={{ width: `${summary.percent}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Tasks loading */}
      {tasksLoading && projectId && (
        <div className="text-center py-8 text-slate-500">Загрузка задач...</div>
      )}

      {/* Task groups */}
      {projectId && !tasksLoading && Object.entries(grouped).map(([category, catTasks]) => {
        const isCollapsed = expandedCategories.has(category)
        const doneCnt = catTasks.filter((t) => t.status === 'done').length
        return (
          <div key={category} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-5 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{category}</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{doneCnt}/{catTasks.length}</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-slate-700/50">
                {catTasks.map((task) => (
                  <div key={task.id} className="px-5 py-3.5 flex items-start gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                        <StatusBadge status={task.status as Status} onClick={() => cycleStatus(task)} />
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                      )}
                      {task.details && task.details.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {task.details.map((d, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-yellow-500/80">
                              <AlertTriangle size={12} className="shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                      <button
                        onClick={() => setModal({ open: true, task })}
                        className="p-1.5 text-slate-500 hover:text-blue-400 rounded"
                        title="Редактировать"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Удалить задачу?')) deleteMut.mutate(task.id) }}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty state */}
      {projectId && !tasksLoading && (!tasks || tasks.length === 0) && (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <p className="text-slate-500 mb-4">Нет задач для этого проекта</p>
          <button
            onClick={() => setModal({ open: true })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            Добавить первую задачу
          </button>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal({ open: false })}
          onSave={(data) => {
            if (modal.task) {
              updateMut.mutate({ id: modal.task.id, data })
            } else {
              createMut.mutate(data)
            }
            setModal({ open: false })
          }}
        />
      )}
    </div>
  )
}
