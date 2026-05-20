import type { TruthFileType } from '@/types'

export type WriteTarget = TruthFileType | 'chapter_draft'

export interface WriteBlock {
  target: WriteTarget
  content: string
}

export interface ParsedMessage {
  textParts: string[]
  writeBlocks: Array<{ index: number; block: WriteBlock }>
  segments: Array<{ type: 'text'; content: string } | { type: 'write'; block: WriteBlock }>
}

export const WRITE_TARGET_LABELS: Record<WriteTarget, string> = {
  worldview: '世界观账本',
  characters: '人物矩阵',
  resources: '资源账本',
  hooks: '悬念钩子',
  summaries: '章节摘要',
  subplots: '支线追踪',
  emotional: '情感弧线',
  chapter_draft: '章节草稿',
}

const VALID_TARGETS = new Set<string>([
  'worldview',
  'characters',
  'resources',
  'hooks',
  'summaries',
  'subplots',
  'emotional',
  'chapter_draft',
])

export function parseMessage(content: string): ParsedMessage {
  const regex = /---WRITE_TO:(\w+)---\n?([\s\S]*?)---END---/g
  const segments: ParsedMessage['segments'] = []
  const textParts: string[] = []
  const writeBlocks: Array<{ index: number; block: WriteBlock }> = []

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, rawTarget, blockContent] = match
    const start = match.index

    // Text before this block
    if (start > lastIndex) {
      const text = content.slice(lastIndex, start)
      if (text) {
        segments.push({ type: 'text', content: text })
        textParts.push(text)
      }
    }

    const target = VALID_TARGETS.has(rawTarget) ? (rawTarget as WriteTarget) : null
    if (target !== null) {
      const block: WriteBlock = { target, content: blockContent }
      writeBlocks.push({ index: segments.length, block })
      segments.push({ type: 'write', block })
    } else {
      // Unknown target — render as plain text
      const text = fullMatch
      segments.push({ type: 'text', content: text })
      textParts.push(text)
    }

    lastIndex = match.index + fullMatch.length
  }

  // Remaining text after last block
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text) {
      segments.push({ type: 'text', content: text })
      textParts.push(text)
    }
  }

  // If no blocks found, the whole content is a single text segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
    textParts.push(content)
  }

  return { textParts, writeBlocks, segments }
}
