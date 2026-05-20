import { useEffect, useState, useCallback, useRef } from 'react'
import { Download, PencilLine } from 'lucide-react'
import { useChaptersStore } from '@/store/chapters'
import { useProjectsStore } from '@/store/projects'
import { useUiStore } from '@/store/ui'
import { useAutoSave } from '@/hooks/useAutoSave'
import Editor from '@/components/editor/Editor'
import { exportChapter, exportAllChapters } from '@/engine/export'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ')
  const chinese = (text.match(/[一-龥]/g) ?? []).length
  const english = (text.match(/\b[a-zA-Z]+\b/g) ?? []).length
  return chinese + english
}

export default function EditorArea() {
  const { chapters, currentChapterId, updateChapterContent, updateWordCount } = useChaptersStore()
  const { projects, currentProjectId } = useProjectsStore()
  const streamingText = useUiStore((s) => s.streamingText)
  const chapter = chapters.find((c) => c.uid === currentChapterId)
  const project = projects.find((p) => p.uid === currentProjectId)

  const [pendingContent, setPendingContent] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(async () => {
    if (!chapter || pendingContent === null) return
    await updateChapterContent(chapter.uid, 'final', pendingContent)
  }, [chapter, pendingContent, updateChapterContent])

  const { trigger } = useAutoSave({
    onSave: handleSave,
    delay: 1000,
    onStatusChange: setSaveStatus,
  })

  const handleChange = useCallback(
    (html: string) => {
      if (!chapter) return
      setPendingContent(html)
      const wc = countWords(html)
      updateWordCount(chapter.uid, wc)
      trigger()
    },
    [chapter, updateWordCount, trigger]
  )

  useEffect(() => {
    setPendingContent(null)
    setSaveStatus('idle')
  }, [currentChapterId])

  useEffect(() => {
    if (!exportOpen) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [exportOpen])

  const statusText: Record<SaveStatus, string> = {
    idle: '',
    saving: '保存中...',
    saved: '已保存',
    error: '保存失败',
  }

  const statusColor: Record<SaveStatus, string> = {
    idle: 'text-ctp-subtext0',
    saving: 'text-ctp-subtext0',
    saved: 'text-ctp-green',
    error: 'text-ctp-red',
  }

  if (!chapter) {
    return (
      <main className="flex-1 flex items-center justify-center bg-ctp-base">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-ctp-surface0 flex items-center justify-center">
            <PencilLine className="w-8 h-8 text-ctp-mauve" />
          </div>
          <div>
            <p className="text-ctp-text text-sm font-medium mb-1">选择章节开始写作</p>
            <p className="text-ctp-subtext0 text-xs">或在左侧「新建章节」开始你的故事</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col bg-ctp-base overflow-hidden">
      <div className="px-6 py-3 border-b border-ctp-surface0 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-medium text-ctp-text truncate">{chapter.title}</h2>
        <div className="flex items-center gap-3">
          <span className={`text-xs transition-colors ${statusColor[saveStatus]}`}>
            {statusText[saveStatus]}
          </span>
          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="p-1.5 rounded text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors"
              title="导出"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {exportOpen && project && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-ctp-surface0 border border-ctp-surface1 rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  className="w-full text-left px-3 py-2 text-xs text-ctp-text hover:bg-ctp-surface1 transition-colors"
                  onClick={() => {
                    exportChapter(chapter, project)
                    setExportOpen(false)
                  }}
                >
                  导出本章
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs text-ctp-text hover:bg-ctp-surface1 transition-colors"
                  onClick={() => {
                    exportAllChapters(chapters, project)
                    setExportOpen(false)
                  }}
                >
                  导出全文
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {streamingText !== null ? (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-ctp-blue mb-4 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ctp-blue animate-pulse" />
                AI 正在生成...
              </p>
              <pre className="text-ctp-text text-sm leading-8 whitespace-pre-wrap font-sans">{streamingText}</pre>
            </div>
          </div>
        ) : (
          <Editor
            key={chapter.uid}
            content={chapter.final || chapter.revised || chapter.draft || ''}
            onChange={handleChange}
            placeholder="开始写作，或使用右侧 AI 助手生成草稿..."
          />
        )}
      </div>

      <div className="px-6 py-2 border-t border-ctp-surface0 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-ctp-subtext0">{chapter.wordCount.toLocaleString()} 字</span>
        <span className="text-xs text-ctp-subtext0 capitalize">{chapter.status}</span>
      </div>
    </main>
  )
}
