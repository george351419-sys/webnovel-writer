import type { Chapter, Project } from '@/types'

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .trim()
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportChapter(chapter: Chapter, project: Project): void {
  const raw = chapter.revised || chapter.draft || chapter.final
  const text = stripHtml(raw)
  const filename = `${project.name}-第${chapter.order + 1}章-${chapter.title}.txt`
  triggerDownload(text, filename)
}

export function exportAllChapters(chapters: Chapter[], project: Project): void {
  const sorted = [...chapters].sort((a, b) => a.order - b.order)
  const parts = sorted.map((ch) => {
    const raw = ch.revised || ch.draft || ch.final
    const text = stripHtml(raw)
    return `第${ch.order + 1}章 ${ch.title}\n\n${text}`
  })
  const content = parts.join('\n\n---\n\n')
  const filename = `${project.name}-全文.txt`
  triggerDownload(content, filename)
}
