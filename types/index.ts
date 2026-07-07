export type Priority = 'high' | 'medium' | 'low'
export type AlertSeverity = 'high' | 'medium' | 'info'
export type BlockType = 'deep_work' | 'admin' | 'family' | 'health' | 'buffer'

export interface Domain {
  id: string
  name: string
  color: string
  sort_order: number
}

export interface Task {
  id: string
  title: string
  description: string | null
  domain_id: string | null
  priority: Priority
  status: 'open' | 'done'
  due_date: string | null
  estimated_minutes: number | null
  created_at: string
  domain?: Domain
}

export interface Alert {
  id: string
  title: string
  body: string
  severity: AlertSeverity
  domain_id: string | null
  url: string | null
  read: boolean
  created_at: string
  domain?: Domain
}

export interface ScheduleBlock {
  id: string
  title: string
  block_type: BlockType
  date: string
  start_time: string
  end_time: string
  domain_id: string | null
  protected: boolean
  notes: string | null
  created_at: string
  domain?: Domain
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
