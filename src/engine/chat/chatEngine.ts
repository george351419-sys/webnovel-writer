import { streamCompletion } from '@/model/router'
import { GENRE_MAP } from '@/genres'
import type { Project, Chapter, TruthFile } from '@/types'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

export async function sendChatMessage(params: {
  userMessage: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  project: Project
  chapter: Chapter | null
  allChapters: Chapter[]
  truthFiles: TruthFile[]
  onChunk: (accumulated: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const { userMessage, history, project, chapter, allChapters, truthFiles, onChunk, signal } = params

  const genreData = GENRE_MAP[project.genre]
  const genreLabel = genreData?.name ?? project.genre

  const worldview = truthFiles.find((f) => f.type === 'worldview')?.content ?? ''
  const characters = truthFiles.find((f) => f.type === 'characters')?.content ?? ''
  const summaries = truthFiles.find((f) => f.type === 'summaries')?.content ?? ''

  const worldviewText = worldview ? worldview.slice(0, 1000) : '暂未填写'
  const charactersText = characters ? characters.slice(0, 800) : '暂未填写'

  // 已有章节列表
  const sortedChapters = [...allChapters].sort((a, b) => a.order - b.order)
  const STATUS_ZH: Record<string, string> = {
    planning: '规划中', drafting: '草稿', auditing: '审稿中', revising: '修订中', confirmed: '已完成'
  }
  const chapterListText = sortedChapters.length > 0
    ? sortedChapters.map((c, i) =>
        `第${i + 1}章《${c.title}》- ${STATUS_ZH[c.status] ?? c.status} - ${c.wordCount}字`
      ).join('\n')
    : '（暂无章节）'

  // 最近已完成的章节内容（供续写参考，最多取最近2章）
  // 有任意内容的章节（wordCount 只在手动编辑时更新，不能用来判断 AI 是否写过）
  const recentDoneChapters = sortedChapters
    .filter((c) => (c.draft || c.revised || c.final).trim().length > 50)
    .slice(-2)

  const recentContentText = recentDoneChapters.length > 0
    ? recentDoneChapters.map((c) => {
        const raw = stripHtml(c.revised || c.draft || c.final || '')
        const preview = raw.slice(-1500) // 取末尾1500字，最接近当前进度
        return `${c.title}（末尾内容）：\n${preview}`
      }).join('\n\n---\n\n')
    : ''

  // 章节摘要
  const summariesText = summaries ? summaries.slice(0, 600) : ''

  // 当前章节详情
  let chapterSection: string
  if (chapter) {
    const raw = stripHtml(chapter.draft || chapter.final || '')
    const contentPreview = raw.slice(0, 800)
    chapterSection = `【当前选中章节】
标题：${chapter.title}
状态：${STATUS_ZH[chapter.status] ?? chapter.status}
已写字数：${chapter.wordCount} 字 / 目标 ${chapter.plan.wordTarget} 字
${contentPreview ? `内容：\n${contentPreview}` : '（暂无内容，待创作）'}`
  } else {
    chapterSection = '【当前选中章节】\n未选中，可直接让我创建新章节'
  }

  const systemPrompt = `你是专业的网文写作 Agent，帮助作者创作网文，可以直接创建章节、续写内容、维护故事提纲。

【当前项目】
项目名：${project.name}
题材：${genreLabel}

【世界观设定】
${worldviewText}

【人物设定】
${charactersText}
${summariesText ? `\n【章节摘要】\n${summariesText}` : ''}

【全部章节（共${sortedChapters.length}章）】
${chapterListText}
${recentContentText ? `\n【最近章节内容（续写参考）】\n${recentContentText}` : ''}

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
