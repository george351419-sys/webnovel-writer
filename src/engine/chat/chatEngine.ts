import { streamCompletion } from '@/model/router'
import { GENRE_MAP } from '@/genres'
import type { Project, Chapter, TruthFile } from '@/types'

export async function sendChatMessage(params: {
  userMessage: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  project: Project
  chapter: Chapter | null
  truthFiles: TruthFile[]
  onChunk: (accumulated: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const { userMessage, history, project, chapter, truthFiles, onChunk, signal } = params

  const genreData = GENRE_MAP[project.genre]
  const genreLabel = genreData?.name ?? project.genre

  const worldview = truthFiles.find((f) => f.type === 'worldview')?.content ?? ''
  const characters = truthFiles.find((f) => f.type === 'characters')?.content ?? ''

  const worldviewText = worldview
    ? worldview.slice(0, 800)
    : '暂未填写'

  const charactersText = characters
    ? characters.slice(0, 600)
    : '暂未填写'

  let chapterSection: string
  if (chapter) {
    const contentPreview = (chapter.draft || chapter.final || '').slice(0, 500)
    chapterSection = `【当前章节】
标题：${chapter.title}
状态：${chapter.status}
字数：${chapter.wordCount} 字
目标：${chapter.plan.wordTarget} 字
${contentPreview ? `内容预览：\n${contentPreview}` : '（暂无内容）'}`
  } else {
    chapterSection = '【当前章节】\n未选中任何章节'
  }

  const systemPrompt = `你是专业的网文写作助手，帮助作者创作网文。你能看到当前项目的完整信息，可以帮助：
- 分析情节、人物、世界观
- 建议章节走向
- 回答写作相关问题
- 生成指定内容（用户要求时）

【当前项目】
项目名：${project.name}
题材：${genreLabel}

【世界观设定】
${worldviewText}

【人物设定】
${charactersText}

${chapterSection}`

  const recentHistory = history.slice(-10)
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  let accumulated = ''
  const result = await streamCompletion(
    'writing',
    messages,
    (chunk) => {
      accumulated += chunk
      onChunk(accumulated)
    },
    signal,
  )

  return result
}
