import type { TruthFileType } from '@/types'

export type ActionType =
  | 'create_chapter'
  | 'write_chapter_draft'
  | 'write_worldview'
  | 'write_characters'
  | 'write_resources'
  | 'write_hooks'
  | 'write_summaries'
  | 'write_subplots'
  | 'write_emotional'

export const ACTION_TRUTH_FILE_MAP: Partial<Record<ActionType, TruthFileType>> = {
  write_worldview:   'worldview',
  write_characters:  'characters',
  write_resources:   'resources',
  write_hooks:       'hooks',
  write_summaries:   'summaries',
  write_subplots:    'subplots',
  write_emotional:   'emotional',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  create_chapter:       '创建章节',
  write_chapter_draft:  '写入章节草稿',
  write_worldview:      '更新世界观账本',
  write_characters:     '更新人物矩阵',
  write_resources:      '更新资源账本',
  write_hooks:          '更新悬念钩子',
  write_summaries:      '更新章节摘要',
  write_subplots:       '更新支线追踪',
  write_emotional:      '更新情感弧线',
}

export interface ActionBlock {
  type: ActionType
  content: string
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'action'; block: ActionBlock }

export function parseMessage(raw: string): MessageSegment[] {
  const VALID = new Set<string>([
    'create_chapter','write_chapter_draft','write_worldview','write_characters',
    'write_resources','write_hooks','write_summaries','write_subplots','write_emotional',
  ])
  const regex = /---ACTION:(\w+)---\n?([\s\S]*?)---END---/g
  const segments: MessageSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(raw)) !== null) {
    const [fullMatch, rawType, content] = match
    if (match.index > lastIndex) {
      const text = raw.slice(lastIndex, match.index).trim()
      if (text) segments.push({ type: 'text', content: text })
    }
    if (VALID.has(rawType)) {
      segments.push({ type: 'action', block: { type: rawType as ActionType, content: content.trim() } })
    }
    // 未知 ACTION 类型静默丢弃，不显示原始标记
    lastIndex = match.index + fullMatch.length
  }
  if (lastIndex < raw.length) {
    const text = raw.slice(lastIndex).trim()
    if (text) segments.push({ type: 'text', content: text })
  }
  if (segments.length === 0) segments.push({ type: 'text', content: raw })
  return segments
}
