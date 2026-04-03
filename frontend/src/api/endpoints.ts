import api from './client'
import type {
  AiInsight,
  Campaign,
  CampaignListResponse,
  Project,
  ProjectTask,
  TaskSummary,
  Credential,
  DailyStats,
  Overview,
  SyncStatus,
  TokenResponse,
} from '../types/api'

// Projects
export const getProjects = () =>
  api.get<Project[]>('/projects').then((r) => r.data)

export const createProject = (data: Partial<Project>) =>
  api.post<Project>('/projects', data).then((r) => r.data)

// Auth
export const login = (email: string, password: string) =>
  api.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data)

export const register = (email: string, password: string) =>
  api.post<TokenResponse>('/auth/register', { email, password }).then((r) => r.data)

// Campaigns
export const getCampaigns = (params?: { status?: string; state?: string; project_id?: number; page?: number }) =>
  api.get<CampaignListResponse>('/campaigns', { params }).then((r) => r.data)

export const getCampaign = (id: number) =>
  api.get<Campaign>(`/campaigns/${id}`).then((r) => r.data)

export const getCampaignStats = (id: number, dateFrom: string, dateTo: string) =>
  api.get<DailyStats[]>(`/campaigns/${id}/stats`, { params: { date_from: dateFrom, date_to: dateTo } }).then((r) => r.data)

export const getCampaignKeywords = (id: number) =>
  api.get(`/campaigns/${id}/keywords`).then((r) => r.data)

export const getCampaignAdGroups = (id: number) =>
  api.get(`/campaigns/${id}/ad-groups`).then((r) => r.data)

// Analytics
export const getOverview = (dateFrom: string, dateTo: string) =>
  api.get<Overview>('/analytics/overview', { params: { date_from: dateFrom, date_to: dateTo } }).then((r) => r.data)

export const getSyncStatus = () =>
  api.get<SyncStatus>('/analytics/sync-status').then((r) => r.data)

// Sync
export const triggerSync = (daysBack = 7) =>
  api.post('/sync/trigger', null, { params: { days_back: daysBack } }).then((r) => r.data)

// AI Insights
export const getInsights = (params?: { campaign_id?: number; insight_type?: string; status?: string }) =>
  api.get<AiInsight[]>('/ai-insights', { params }).then((r) => r.data)

export const getInsight = (id: number) =>
  api.get<AiInsight>(`/ai-insights/${id}`).then((r) => r.data)

export const analyzePerformance = (campaignId: number) =>
  api.post<AiInsight>(`/ai-insights/campaign/${campaignId}/performance`).then((r) => r.data)

export const analyzeKeywords = (campaignId: number) =>
  api.post<AiInsight>(`/ai-insights/campaign/${campaignId}/keywords`).then((r) => r.data)

export const suggestAdVariants = (adGroupId: number) =>
  api.post<AiInsight>(`/ai-insights/ad-group/${adGroupId}/ad-variants`).then((r) => r.data)

export const updateInsightStatus = (id: number, status: string) =>
  api.patch(`/ai-insights/${id}/status`, null, { params: { new_status: status } }).then((r) => r.data)

// Settings
export const getCredentials = () =>
  api.get<Credential[]>('/settings/credentials').then((r) => r.data)

export const saveCredential = (data: {
  service: string
  oauth_token: string
  client_login?: string
  counter_id?: number
  host_id?: string
}) => api.post<Credential>('/settings/credentials', data).then((r) => r.data)

// Project Tasks
export const getProjectTasks = (projectId: number, params?: { category?: string; status?: string }) =>
  api.get<ProjectTask[]>(`/projects/${projectId}/tasks`, { params }).then((r) => r.data)

export const getTaskSummary = (projectId: number) =>
  api.get<TaskSummary>(`/projects/${projectId}/tasks/summary`).then((r) => r.data)

export const createProjectTask = (projectId: number, data: Partial<ProjectTask>) =>
  api.post<ProjectTask>(`/projects/${projectId}/tasks`, data).then((r) => r.data)

export const updateProjectTask = (projectId: number, taskId: number, data: Partial<ProjectTask>) =>
  api.put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data)

export const deleteProjectTask = (projectId: number, taskId: number) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data)
