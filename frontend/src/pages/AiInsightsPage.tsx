import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Brain, Check, X } from 'lucide-react'
import { getInsights, updateInsightStatus } from '../api/endpoints'
import StatusBadge from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useState } from 'react'

export default function AiInsightsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getInsights(),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateInsightStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] }),
  })

  if (isLoading) return <LoadingSpinner />

  const typeLabels: Record<string, string> = {
    PERFORMANCE: 'Эффективность',
    KEYWORDS: 'Ключевые слова',
    QUERIES: 'Поисковые запросы',
    AD_VARIANTS: 'Варианты объявлений',
    OPTIMIZATION: 'Оптимизация',
    AB_TEST: 'A/B тест',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="text-purple-400" size={24} />
        <h2 className="text-xl font-semibold">AI-аналитика</h2>
      </div>

      {insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-750 transition-colors"
                onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      {typeLabels[insight.insight_type] || insight.insight_type}
                    </span>
                    <StatusBadge value={insight.status} />
                  </div>
                  <h3 className="text-sm font-medium text-slate-200">{insight.title}</h3>
                  <span className="text-xs text-slate-500 mt-1">
                    {new Date(insight.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>

              {expandedId === insight.id && (
                <div className="border-t border-slate-700">
                  <div className="px-5 py-4 text-sm text-slate-300 whitespace-pre-wrap max-h-96 overflow-auto">
                    {insight.content}
                  </div>

                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="px-5 py-4 border-t border-slate-700">
                      <h4 className="text-xs font-medium text-slate-400 mb-3">Рекомендации:</h4>
                      <div className="space-y-2">
                        {insight.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3">
                            <StatusBadge value={rec.priority} />
                            <div className="flex-1">
                              <p className="text-sm text-slate-200">{rec.action}</p>
                              <p className="text-xs text-slate-500 mt-1">{rec.expected_impact}</p>
                            </div>
                            <span className="text-xs text-slate-500">{Math.round(rec.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-slate-700 flex gap-2">
                    <button
                      onClick={() => statusMutation.mutate({ id: insight.id, status: 'APPLIED' })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                    >
                      <Check size={14} /> Применено
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: insight.id, status: 'DISMISSED' })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-600/20 text-slate-400 rounded-lg hover:bg-slate-600/30 transition-colors"
                    >
                      <X size={14} /> Отклонить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <Brain size={40} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">AI-инсайтов пока нет</h3>
          <p className="text-slate-500">
            Откройте кампанию и нажмите «AI-анализ» для генерации рекомендаций
          </p>
        </div>
      )}
    </div>
  )
}
