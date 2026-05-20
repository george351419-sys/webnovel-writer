import type { Chapter, Project, TruthFile, TruthFileType } from '@/types'
import { completeJson } from '@/model/router'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

const TRUTH_FILE_LABELS: Record<TruthFileType, string> = {
  worldview: '世界观设定',
  characters: '人物设定',
  resources: '资源道具',
  hooks: '伏笔悬念',
  summaries: '章节摘要',
  subplots: '支线剧情',
  emotional: '情感关系',
}

interface TruthFileUpdate {
  type: TruthFileType
  content: string
}

interface UpdateResponse {
  updates: TruthFileUpdate[]
}

export async function updateTruthFilesAfterConfirm(params: {
  chapter: Chapter
  project: Project
  currentTruthFiles: TruthFile[]
}): Promise<Map<TruthFileType, string>> {
  const { chapter, project, currentTruthFiles } = params

  // Use revised content if available, otherwise fall back to draft
  const rawContent = chapter.revised || chapter.draft
  const plainText = stripHtml(rawContent)

  // Build current truth files context
  const currentFilesContext = currentTruthFiles
    .map((f) => `【${TRUTH_FILE_LABELS[f.type]}】\n${f.content || '（暂无内容）'}`)
    .join('\n\n')

  const systemPrompt = `你是一位专业的网文编辑助手，负责在章节确认后更新"真相文件"（存储小说关键信息的文档）。

真相文件说明：
- 世界观设定：世界规则、地理、历史背景等
- 人物设定：角色外貌、性格、能力、关系等
- 资源道具：重要物品、法宝、财富等
- 伏笔悬念：已埋下的伏笔和未解悬念
- 章节摘要：各章节的内容摘要（必须更新，追加本章摘要）
- 支线剧情：各支线的当前进展
- 情感关系：角色间的情感变化

更新原则：
1. 章节摘要（summaries）必须更新，追加本章的简要摘要
2. 其他类型只在本章有明确新增或改变信息时才更新
3. 更新内容应追加到现有内容之后，不要删除原有信息
4. 返回JSON格式，只包含需要更新的文件类型

返回格式：
{
  "updates": [
    {
      "type": "summaries",
      "content": "（完整的新内容，包含原有内容加上本章新增内容）"
    }
  ]
}`

  const userPrompt = `【项目名称】${project.name}
【当前章节】第${chapter.order}章《${chapter.title}》

【现有真相文件内容】
${currentFilesContext}

【本章正文内容】
${plainText}

请分析本章内容，提取新增或变化的信息，更新对应的真相文件。章节摘要必须更新（追加本章摘要）。`

  const result = await completeJson<UpdateResponse>('writing', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  const updateMap = new Map<TruthFileType, string>()

  if (result && Array.isArray(result.updates)) {
    for (const update of result.updates) {
      if (update.type && typeof update.content === 'string') {
        updateMap.set(update.type, update.content)
      }
    }
  }

  // Ensure summaries is always updated even if AI didn't include it
  if (!updateMap.has('summaries')) {
    const existingSummaries = currentTruthFiles.find((f) => f.type === 'summaries')?.content ?? ''
    const appendedSummary = existingSummaries
      ? `${existingSummaries}\n\n第${chapter.order}章《${chapter.title}》：${plainText.slice(0, 200)}...`
      : `第${chapter.order}章《${chapter.title}》：${plainText.slice(0, 200)}...`
    updateMap.set('summaries', appendedSummary)
  }

  return updateMap
}
