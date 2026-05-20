import type { AuditIssue, Genre } from '@/types'
import { completeJson } from '@/model/router'
import { AUDIT_DIMENSIONS } from './dimensions'
import { parseAuditResponse } from './parser'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function buildDimensionsDescription(): string {
  const groups = new Map<string, typeof AUDIT_DIMENSIONS>()
  for (const dim of AUDIT_DIMENSIONS) {
    if (!groups.has(dim.group)) groups.set(dim.group, [])
    groups.get(dim.group)!.push(dim)
  }

  const lines: string[] = []
  for (const [group, dims] of groups) {
    lines.push(`【${group}】`)
    for (const dim of dims) {
      lines.push(`- ${dim.name}（${dim.id}）：${dim.description}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

const GENRE_LABELS: Record<Genre, string> = {
  xuanhuan: '玄幻',
  system: '系统流',
  urban: '都市',
  scifi: '科幻',
  history: '历史',
  romance: '言情',
}

export async function runAudit(
  chapterContent: string,
  genre: Genre,
): Promise<AuditIssue[]> {
  const plainText = stripHtml(chapterContent)
  const genreLabel = GENRE_LABELS[genre]
  const dimensionsDesc = buildDimensionsDescription()

  const systemPrompt = `你是一位专业的网文编辑，擅长${genreLabel}类型小说的审稿工作。
你需要对提供的章节内容进行全面审稿，从以下33个维度逐一评估：

${dimensionsDesc}
请以JSON格式返回审稿结果，格式如下：
{
  "issues": [
    {
      "dimension": "维度名称",
      "severity": "high|medium|low",
      "description": "问题描述（具体说明发现了什么问题）",
      "suggestion": "修改建议（具体说明如何改进）"
    }
  ]
}

严重程度说明：
- high：严重问题，必须修改，影响阅读体验或逻辑连贯性
- medium：中等问题，建议修改，会影响作品质量
- low：轻微问题，可选修改，有提升空间

注意：只输出有问题的维度，没有问题的维度不需要列出。`

  const userPrompt = `请对以下${genreLabel}网文章节进行审稿：

${plainText}`

  const result = await completeJson<{ issues: AuditIssue[] }>('audit', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  return parseAuditResponse(result)
}
