import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  Target,
  MessageSquare,
  Send,
  Camera,
  Brain,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/metrika', icon: BarChart2, label: 'Метрика' },
  { to: '/webmaster', icon: Globe, label: 'Вебмастер' },
  { to: '/direct', icon: Target, label: 'Яндекс Директ' },
  { to: '/vk', icon: MessageSquare, label: 'VK Реклама' },
  { to: '/telegram', icon: Send, label: 'Telegram' },
  { to: '/instagram', icon: Camera, label: 'Instagram' },
  { to: '/ai-insights', icon: Brain, label: 'AI-аналитика' },
  { to: '/tasks', icon: ClipboardList, label: 'Задачи' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">Artika</h1>
        <p className="text-xs text-slate-500 mt-1">AI-маркетинг аналитика</p>
      </div>

      <nav className="flex-1 px-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
