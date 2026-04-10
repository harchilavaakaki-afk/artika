import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MetrikaPage from './pages/MetrikaPage'
import CampaignsPage from './pages/CampaignsPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import KeywordsPage from './pages/KeywordsPage'
import WebmasterPage from './pages/WebmasterPage'
import DirectPage from './pages/DirectPage'
import CalltouchPage from './pages/CalltouchPage'
import VKPage from './pages/VKPage'
import TelegramPage from './pages/TelegramPage'
import InstagramPage from './pages/InstagramPage'
import AiInsightsPage from './pages/AiInsightsPage'
import AbTestsPage from './pages/AbTestsPage'
import SettingsPage from './pages/SettingsPage'
import TasksPage from './pages/TasksPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/metrika" element={<MetrikaPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/keywords" element={<KeywordsPage />} />
            <Route path="/webmaster" element={<WebmasterPage />} />
            <Route path="/direct" element={<DirectPage />} />
            <Route path="/calltouch" element={<CalltouchPage />} />
            <Route path="/vk" element={<VKPage />} />
            <Route path="/telegram" element={<TelegramPage />} />
            <Route path="/instagram" element={<InstagramPage />} />
            <Route path="/ai-insights" element={<AiInsightsPage />} />
            <Route path="/ab-tests" element={<AbTestsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
