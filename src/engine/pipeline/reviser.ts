import type { Chapter } from '@/types'
import { streamCompletion } from '@/model/router'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export async function generateRevision(params: {
  chapter: Chapter
  onChunk: (accumulated: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const { chapter, onChunk, signal } = params

  const plainDraft = stripHtml(chapter.draft)

  // Filter only high and medium severity issues
  const significantIssues = chapter.auditReport.filter(
    (issue) => issue.severity === 'high' || issue.severity === 'medium',
  )

  const issuesText =
    significantIssues.length > 0
      ? significantIssues
          .map(
            (issue, idx) =>
              `${idx + 1}. 【${issue.dimension}】（${issue.severity === 'high' ? '严重' : '中等'}）\n   问题：${issue.description}\n   建议：${issue.suggestion}`,
          )
          .join('\n\n')
      : '（无需重点修改的问题，请在保持原有风格的基础上对文字进行润色优化）'

  const systemPrompt = `你是一位专业的网文编辑，负责根据审稿意见对章节进行修订。

修订原则：
1. 严格针对审稿意见中指出的问题进行修改，不要无故改动其他内容
2. 保持原有的写作风格和叙事节奏
3. 修订后的内容应比原稿更流畅、更有爽感
4. 输出完整的修订后正文，不需要任何说明或标注`

  const userPrompt = `【原始草稿】
${plainDraft}

【审稿意见（需要重点处理的问题）】
${issuesText}

请根据以上审稿意见，对原稿进行修订，输出完整的修订版正文。`

  let accumulated = ''
  const result = await streamCompletion(
    'revise',
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
