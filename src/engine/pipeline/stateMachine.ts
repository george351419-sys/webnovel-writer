import type { ChapterStatus } from '@/types'

export type PipelineAction = 'startDraft' | 'startAudit' | 'startRevise' | 'confirm' | 'rollback'

interface Transition {
  from: ChapterStatus
  action: PipelineAction
  to: ChapterStatus
}

const TRANSITIONS: Transition[] = [
  { from: 'planning',  action: 'startDraft',  to: 'drafting'  },
  { from: 'drafting',  action: 'startAudit',  to: 'auditing'  },
  { from: 'auditing',  action: 'startRevise', to: 'revising'  },
  { from: 'revising',  action: 'confirm',     to: 'confirmed' },
  // rollback
  { from: 'drafting',  action: 'rollback', to: 'planning'  },
  { from: 'auditing',  action: 'rollback', to: 'drafting'  },
  { from: 'revising',  action: 'rollback', to: 'auditing'  },
  { from: 'confirmed', action: 'rollback', to: 'revising'  },
]

export function canPerform(status: ChapterStatus, action: PipelineAction): boolean {
  return TRANSITIONS.some((t) => t.from === status && t.action === action)
}

export function nextStatus(status: ChapterStatus, action: PipelineAction): ChapterStatus | null {
  const t = TRANSITIONS.find((tr) => tr.from === status && tr.action === action)
  return t ? t.to : null
}

export const STEP_ORDER: ChapterStatus[] = ['planning', 'drafting', 'auditing', 'revising', 'confirmed']

export function stepIndex(status: ChapterStatus): number {
  return STEP_ORDER.indexOf(status)
}

export const STATUS_LABELS: Record<ChapterStatus, string> = {
  planning:  '章节规划',
  drafting:  '生成草稿',
  auditing:  '33维审稿',
  revising:  '自动修订',
  confirmed: '人工确认',
}
