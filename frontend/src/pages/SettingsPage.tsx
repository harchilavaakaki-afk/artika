import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, CheckCircle } from 'lucide-react'
import { getCredentials, saveCredential } from '../api/endpoints'
import LoadingSpinner from '../components/common/LoadingSpinner'

const services = [
  {
    key: 'YANDEX_DIRECT',
    name: 'Яндекс Директ',
    description: 'Управление рекламными кампаниями',
    fields: ['oauth_token', 'client_login'],
  },
  {
    key: 'YANDEX_METRIKA',
    name: 'Яндекс Метрика',
    description: 'Аналитика трафика и конверсий',
    fields: ['oauth_token', 'counter_id'],
  },
  {
    key: 'YANDEX_WEBMASTER',
    name: 'Яндекс Вебмастер',
    description: 'Органический поиск и индексация',
    fields: ['oauth_token', 'host_id'],
  },
  {
    key: 'VK_ADS',
    name: 'VK Реклама (myTarget)',
    description: 'Рекламные кампании VK, таргетированная реклама',
    fields: ['oauth_token'],
  },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({})
  const [savedService, setSavedService] = useState<string | null>(null)

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: getCredentials,
  })

  const saveMutation = useMutation({
    mutationFn: saveCredential,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
      setSavedService(variables.service)
      setTimeout(() => setSavedService(null), 3000)
    },
  })

  const getField = (service: string, field: string) => {
    return forms[service]?.[field] || ''
  }

  const setField = (service: string, field: string, value: string) => {
    setForms((prev) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value },
    }))
  }

  const handleSave = (serviceKey: string) => {
    const form = forms[serviceKey] || {}
    saveMutation.mutate({
      service: serviceKey,
      oauth_token: form.oauth_token || '',
      client_login: form.client_login || undefined,
      counter_id: form.counter_id ? parseInt(form.counter_id) : undefined,
      host_id: form.host_id || undefined,
    })
  }

  const existingCred = (service: string) =>
    credentials?.find((c) => c.service === service)

  if (isLoading) return <LoadingSpinner />

  const fieldLabels: Record<string, string> = {
    oauth_token: 'OAuth токен',
    client_login: 'Логин клиента (необязательно)',
    counter_id: 'ID счётчика Метрики',
    host_id: 'ID хоста (например, https:example.com:443)',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-slate-400" size={24} />
        <h2 className="text-xl font-semibold">Настройки</h2>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Как получить OAuth токен</h3>
        <ol className="text-sm text-slate-500 space-y-1 list-decimal list-inside">
          <li>Перейдите на <span className="text-blue-400">oauth.yandex.ru/client/new</span></li>
          <li>Создайте приложение с правами: Яндекс.Директ API, Яндекс.Метрика, Яндекс.Вебмастер</li>
          <li>Укажите Redirect URI: <code className="text-xs bg-slate-900 px-1 py-0.5 rounded">https://oauth.yandex.ru/verification_code</code></li>
          <li>Получите токен по ссылке: <code className="text-xs bg-slate-900 px-1 py-0.5 rounded">https://oauth.yandex.ru/authorize?response_type=token&client_id=ВАШ_CLIENT_ID</code></li>
        </ol>
      </div>

      {services.map((svc) => {
        const existing = existingCred(svc.key)
        return (
          <div key={svc.key} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-slate-200">{svc.name}</h3>
                <p className="text-xs text-slate-500">{svc.description}</p>
              </div>
              {existing && (
                <div className="flex items-center gap-1 text-green-400 text-xs">
                  <CheckCircle size={14} />
                  Настроен
                </div>
              )}
            </div>

            <div className="space-y-3">
              {svc.fields.map((field) => (
                <div key={field}>
                  <label className="block text-xs text-slate-400 mb-1">
                    {fieldLabels[field] || field}
                  </label>
                  <input
                    type={field === 'oauth_token' ? 'password' : 'text'}
                    value={getField(svc.key, field)}
                    onChange={(e) => setField(svc.key, field, e.target.value)}
                    placeholder={existing ? '••• настроен (введите новый для обновления)' : ''}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => handleSave(svc.key)}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                Сохранить
              </button>
              {savedService === svc.key && (
                <span className="text-green-400 text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> Сохранено
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
