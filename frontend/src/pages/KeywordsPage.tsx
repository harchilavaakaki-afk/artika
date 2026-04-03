import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { getCampaigns, getCampaignKeywords } from '../api/endpoints'
import StatusBadge from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function KeywordsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: campaignsData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => getCampaigns(),
  })

  const { data: keywords, isLoading: loadingKeywords } = useQuery({
    queryKey: ['campaignKeywords', selectedCampaign],
    queryFn: () => getCampaignKeywords(selectedCampaign!),
    enabled: !!selectedCampaign,
  })

  const filteredKeywords = (keywords || []).filter((kw: any) =>
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loadingCampaigns) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="text-slate-400" size={24} />
          <h2 className="text-xl font-semibold">Ключевые слова</h2>
        </div>
      </div>

      {/* Campaign selector + search */}
      <div className="flex gap-4">
        <select
          value={selectedCampaign || ''}
          onChange={(e) => setSelectedCampaign(e.target.value ? Number(e.target.value) : null)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">Выберите кампанию</option>
          {campaignsData?.campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedCampaign && (
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по ключевым словам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Keywords table */}
      {!selectedCampaign && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <Search size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Выберите кампанию для просмотра ключевых слов</p>
        </div>
      )}

      {selectedCampaign && loadingKeywords && <LoadingSpinner text="Загрузка ключевых слов..." />}

      {selectedCampaign && !loadingKeywords && filteredKeywords.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-400">Найдено: {filteredKeywords.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-700">
                <th className="px-5 py-3 font-medium">Ключевое слово</th>
                <th className="px-5 py-3 font-medium">Yandex ID</th>
                <th className="px-5 py-3 font-medium text-right">Ставка</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Статус показа</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((kw: any) => (
                <tr key={kw.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-5 py-3 text-slate-200">{kw.keyword}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{kw.yandex_id}</td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    {kw.bid ? `${parseFloat(kw.bid).toFixed(2)} ₽` : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge value={kw.status} /></td>
                  <td className="px-5 py-3"><StatusBadge value={kw.serving_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCampaign && !loadingKeywords && filteredKeywords.length === 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
          <p className="text-slate-500">
            {searchTerm ? 'Ничего не найдено по запросу' : 'Ключевые слова не найдены. Синхронизируйте данные.'}
          </p>
        </div>
      )}
    </div>
  )
}
