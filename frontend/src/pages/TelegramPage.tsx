import { Send } from 'lucide-react'

export default function TelegramPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="text-slate-400" size={24} />
        <h2 className="text-xl font-semibold">Telegram Ads</h2>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center">
        <Send size={48} className="text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">Не подключено</h3>
        <p className="text-slate-500 text-sm">
          Инструкция по подключению скоро появится.
        </p>
      </div>
    </div>
  )
}
