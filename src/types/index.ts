export type Genre = 'xuanhuan' | 'system' | 'urban' | 'scifi' | 'history' | 'romance'

export type ChapterStatus = 'planning' | 'drafting' | 'auditing' | 'revising' | 'confirmed'

export type TruthFileType =
  | 'worldview'
  | 'characters'
  | 'resources'
  | 'hooks'
  | 'summaries'
  | 'subplots'
  | 'emotional'

export type AuditSeverity = 'high' | 'medium' | 'low'

export interface AuditIssue {
  dimension: string
  severity: AuditSeverity
  description: string
  suggestion: string
  resolved: boolean
}

export interface ChapterPlan {
  goal: string
  wordTarget: number
  subplotsToAdvance: string[]
}

export interface Project {
  id?: number
  uid: string
  name: string
  genre: Genre
  styleFingerprint?: string
  createdAt: Date
  updatedAt: Date
}

export interface Chapter {
  id?: number
  uid: string
  projectId: string
  title: string
  order: number
  plan: ChapterPlan
  draft: string
  auditReport: AuditIssue[]
  revised: string
  final: string
  status: ChapterStatus
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TruthFile {
  id?: number
  uid: string
  projectId: string
  type: TruthFileType
  content: string
  updatedAt: Date
}
