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

${chapterSection}

---

当用户要求你生成需要保存到文件的内容时（如世界观设定、人物档案、章节草稿等），请使用以下格式输出，让内容可以直接写入对应文件：

---WRITE_TO:[type]---
[内容]
---END---

type 的可选值：
- worldview（世界观账本）
- characters（人物矩阵）
- resources（资源账本）
- hooks（悬念钩子）
- summaries（章节摘要）
- subplots（支线追踪）
- emotional（情感弧线）
- chapter_draft（当前章节草稿）

示例：如果用户说"帮我设计世界观"，你应该输出：
先用几句话描述你的思路，然后：
---WRITE_TO:worldview---
（完整的世界观内容，可以很长）
---END---

注意：
1. 一次回复可以包含多个 WRITE_TO 块
2. WRITE_TO 块之外的内容正常显示在对话中
3. 如果用户只是问问题、不需要写入文件，就正常回复，不用 WRITE_TO 格式`

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
