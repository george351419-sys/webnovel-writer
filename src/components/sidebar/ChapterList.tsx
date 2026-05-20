import { Plus } from 'lucide-react'
import { useChaptersStore } from '@/store/chapters'
import { useUiStore } from '@/store/ui'
import type { ChapterStatus } from '@/types'

const STATUS_ICON: Record<ChapterStatus, string> = {
  planning:  '📋',
  drafting:  '✍️',
  auditing:  '🔍',
  revising:  '✏️',
  confirmed: '✓',
}

const STATUS_COLOR: Record<ChapterStatus, string> = {
  planning:  'text-ctp-subtext0',
  drafting:  'text-ctp-blue',
  auditing:  'text-ctp-yellow',
  revising:  'text-ctp-peach',
  confirmed: 'text-ctp-green',
}

interface Props {
  projectId: string
  expanded: boolean
  onToggle: () => void
}

export default function ChapterList({ projectId, expanded, onToggle }: Props) {
  const { chapters, currentChapterId, setCurrentChapter, createChapter } = useChaptersStore()
  const setActiveView = useUiStore((s) => s.setActiveView)

  const handleSelect = (uid: string) => {
    setCurrentChapter(uid)
    setActiveView('editor')
  }

  const handleAddChapter = async () => {
    const n = chapters.length + 1
    const chapter = await createChapter(projectId, `第${n}章`)
    handleSelect(chapter.uid)
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ctp-subtext0 hover:text-ctp-text transition-colors mt-1"
      >
        <span>📖</span>
        <span>正文</span>
        <span className="ml-auto text-ctp-overlay0">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="space-y-0.5 pb-1">
          {chapters.map((ch) => (
            <button
              key={ch.uid}
              onClick={() => handleSelect(ch.uid)}
              className={`w-full text-left px-3 py-1 text-xs rounded transition-colors pl-7 flex items-center justify-between gap-1 ${
                currentChapterId === ch.uid
                  ? 'bg-ctp-blue/20 text-ctp-blue'
                  : 'text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text'
              }`}
            >
              <span className="truncate">{ch.title}</span>
              <span className={`flex-shrink-0 text-xs ${STATUS_COLOR[ch.status]}`}>
                {STATUS_ICON[ch.status]}
              </span>
            </button>
          ))}
          <button
            onClick={handleAddChapter}
            className="w-full text-left px-3 py-1 text-xs text-ctp-overlay0 hover:text-ctp-mauve hover:bg-ctp-surface0 rounded transition-colors pl-7 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>新建章节</span>
          </button>
        </div>
      )}
    </div>
  )
}
