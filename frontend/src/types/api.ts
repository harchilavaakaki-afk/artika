export interface Project {
  id: number
  name: string
  domain: string | null
  description: string | null
  metrika_counter_id: number | null
  webmaster_host_id: string | null
  direct_client_login: string | null
  is_active: boolean
}

export interface Campaign {
  id: number
  yandex_id: number
  name: string
  type: string | null
  status: string | null
  state: string | null
  daily_budget: string | null
  start_date: string | null
  end_date: string | null
  strategy_type: string | null
  project_id: number | null
  synced_at: string | null
}

export interface CampaignListResponse {
  campaigns: Campaign[]
  total: number
}

export interface DailyStats {
  id: number
  campaign_id: number
  date: string
  impressions: number
  clicks: number
  cost: string
  conversions: number
  revenue: string
  ctr: string
  avg_cpc: string
  avg_position: string | null
  bounce_rate: string | null
}

export interface Overview {
  total_spend: string
  total_clicks: number
  total_impressions: number
  total_conversions: number
  avg_ctr: string
  avg_cpc: string
  avg_cpa: string | null
  spend_delta: string | null
  clicks_delta: string | null
  conversions_delta: string | null
  ctr_delta: string | null
}

export interface SyncStatus {
  last_sync: string | null
  campaigns: number
  ad_groups: number
  ads: number
  keywords: number
}

export interface AiInsight {
  id: number
  campaign_id: number | null
  insight_type: string
  title: string
  content: string
  recommendations: Recommendation[] | null
  status: string
  created_at: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
  expected_impact: string
  confidence: number
}

export interface Credential {
  id: number
  service: string
  client_login: string | null
  counter_id: number | null
  host_id: string | null
  is_active: boolean
  last_validated: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  email: string
  is_active: boolean
}

export interface ProjectTask {
  id: number
  project_id: number | null
  title: string
  description: string | null
  status: 'done' | 'partial' | 'not_started' | 'bug'
  category: string | null
  details: string[] | null
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface TaskSummary {
  total: number
  done: number
  partial: number
  not_started: number
  bug: number
  percent: number
}
