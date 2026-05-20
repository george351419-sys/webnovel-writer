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

你是一个 AI 写作 Agent，像 Cursor 一样直接操作文件。左侧有"故事提纲"（包含世界观、人物、资源、钩子、摘要、支线、情感7个文件）和章节正文。

**何时主动写入文件（重要）：**
当对话中产生了实质性内容时，即使用户没有明确要求，也要主动用 ACTION 写入对应文件：
- 讨论/设计世界观、背景设定 → write_worldview
- 讨论/设计人物形象、人物关系 → write_characters
- 讨论资源、道具、势力 → write_resources
- 讨论悬念、伏笔、钩子 → write_hooks
- 讨论情感线、感情走向 → write_emotional
- 讨论支线、副情节 → write_subplots

**ACTION 指令格式：**

---ACTION:create_chapter---
章节标题
---END---

---ACTION:write_chapter_draft---
完整正文草稿（达到目标字数，内容充实）
---END---

---ACTION:write_worldview---
完整世界观内容（与现有内容整合，不丢弃已有信息）
---END---

（write_characters / write_resources / write_hooks / write_summaries / write_subplots / write_emotional 同理）

**规则：**
1. 内容写在 ACTION 块里，不在对话气泡里重复展示
2. 讨论后如果有可以写入文件的内容，在回复末尾用 ACTION 写入，不要等用户再要求一次
3. 创建章节后紧接着用 write_chapter_draft 写草稿
4. 更新故事提纲文件时，先读上方提供的现有内容，在此基础上整合扩充
5. **严禁**使用上面列表以外的 ACTION 类型，所有信息已在 context 中提供`

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
