import type { Chapter, Project, TruthFile } from '@/types'
import { streamCompletion } from '@/model/router'
import { GENRE_MAP } from '@/genres'

export async function generateDraft(params: {
  chapter: Chapter
  project: Project
  truthFiles: TruthFile[]
  allChapters: Chapter[]
  onChunk: (accumulated: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const { chapter, project, truthFiles, allChapters, onChunk, signal } = params

  // Extract truth file contents by type
  const worldview = truthFiles.find((f) => f.type === 'worldview')?.content ?? ''
  const characters = truthFiles.find((f) => f.type === 'characters')?.content ?? ''

  // Only take the most recent 3 summaries chapters
  const summariesFile = truthFiles.find((f) => f.type === 'summaries')
  const recentSummaries = summariesFile?.content ?? ''

  // Get previous confirmed/revised chapters as context (title + word count)
  const previousChapters = allChapters
    .filter((c) => c.order < chapter.order && c.status === 'confirmed')
    .sort((a, b) => a.order - b.order)
    .slice(-3)
    .map((c) => `第${c.order}章《${c.title}》（约${c.wordCount}字）`)

  const genreData = GENRE_MAP[project.genre]
  const genreLabel = genreData?.name ?? project.genre

  const contextParts: string[] = []

  if (worldview) {
    contextParts.push(`【世界观设定】\n${worldview}`)
  }
  if (characters) {
    contextParts.push(`【人物设定】\n${characters}`)
  }
  if (recentSummaries) {
    contextParts.push(`【近期章节摘要】\n${recentSummaries}`)
  }
  if (previousChapters.length > 0) {
    contextParts.push(`【已完成章节】\n${previousChapters.join('\n')}`)
  }

  const subplotsText =
    chapter.plan.subplotsToAdvance.length > 0
      ? `需要推进的支线：${chapter.plan.subplotsToAdvance.join('、')}`
      : ''

  const genreSection = genreData
    ? `\n${genreData.systemPrompt}\n`
    : `\n写作要求：\n1. 使用地道的中文网文写法，语言生动流畅，符合${genreLabel}类型的文风\n`

  const styleFingerprintSection = project.styleFingerprint
    ? `\n写作风格要求（来自风格指纹）：\n${project.styleFingerprint}\n`
    : ''

  const systemPrompt = `你是一位经验丰富的${genreLabel}网文作家，擅长写出流畅地道、引人入胜的网文章节。
${genreSection}${styleFingerprintSection}
通用写作要求：
1. 严格按照章节规划和目标字数进行创作
2. 章节需要有清晰的节奏感，保持读者的阅读热情
3. 合理设置爽点和悬念，章末留有钩子吸引读者继续阅读
4. 人物对白自然生动，体现各角色的性格特点
5. 输出纯文本正文，不需要添加任何格式标记或章节标题`

  const contextSection = contextParts.length > 0 ? contextParts.join('\n\n') + '\n\n' : ''

  const writingTipsSection = genreData ? `\n写作提示：${genreData.writingTips}` : ''

  const userPrompt = `${contextSection}【当前章节信息】
章节标题：${chapter.title}
章节目标：${chapter.plan.goal}
目标字数：约${chapter.plan.wordTarget}字
${subplotsText}

请根据以上信息，创作本章的完整正文内容。${writingTipsSection}`

  let accumulated = ''
  const result = await streamCompletion(
    'writing',
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    (chunk) => {
      accumulated += chunk
      onChunk(accumulated)
    },
    signal,
  )

  return result
}
