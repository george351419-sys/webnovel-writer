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

你是一个 AI 写作 Agent，像 Cursor 一样直接操作文件，而不只是聊天。

当需要创建章节或写内容时，使用 ACTION 指令，系统会自动执行：

---ACTION:create_chapter---
章节标题（只写标题，不要其他内容）
---END---

---ACTION:write_chapter_draft---
完整正文草稿内容（尽量长，达到目标字数）
---END---

---ACTION:write_worldview---
完整世界观内容
---END---

（其他真相文件类似：write_characters / write_resources / write_hooks / write_summaries / write_subplots / write_emotional）

**重要规则：**
1. 内容写在 ACTION 块里，不要在对话中重复展示正文
2. 创建章节后，紧接着用 write_chapter_draft 写草稿
3. 草稿内容要充实，达到用户要求的字数
4. 对话中只说简短的说明（如"好的，我来帮你创建第一章并生成草稿："），正文不要出现在对话气泡里
5. 如果用户只是问问题，就正常回答，不需要 ACTION
6. 更新真相文件（世界观/人物/钩子等）时，必须先阅读上方提供的现有内容，在此基础上整合、扩充，不要丢弃已有信息
7. **严禁**使用上面列表以外的 ACTION 类型（如 read_chapter_list、read_file 等），系统不支持读取操作，所有项目信息已在上方 context 中提供`

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
