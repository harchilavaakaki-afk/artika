import { BarChart3, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCampaigns } from '../api/endpoints'
import StatusBadge from '../components/common/StatusBadge'

export default function AbTestsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => getCampaigns(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-slate-400" size={24} />
          <h2 className="text-xl font-semibold">A/B тесты</h2>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={16} />
          Новый тест
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h3 className="font-medium text-slate-200">Создать A/B тест</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Название теста</label>
              <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Тест заголовков объявлений" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Кампания</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                <option value="">Выберите кампанию</option>
                {campaignsData?.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Метрика успеха</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                <option value="CTR">CTR</option>
                <option value="CPA">CPA</option>
                <option value="CONVERSION_RATE">Конверсия</option>
                <option value="ROI">ROI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Описание</label>
              <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Сравниваем два варианта заголовков" />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              Создать тест
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
              Отмена
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Для создания A/B теста необходимы синхронизированные кампании с объявлениями.
            Тест будет отслеживать эффективность вариантов A и B по выбранной метрике.
          </p>
        </div>
      )}

      {/* Empty state */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
        <BarChart3 size={40} className="text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">A/B тестов пока нет</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Создайте тест, чтобы сравнить эффективность разных объявлений, заголовков или ключевых слов.
          Система автоматически рассчитает статистическую значимость результатов.
        </p>
      </div>
    </div>
  )
}
