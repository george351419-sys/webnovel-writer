import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useChaptersStore } from '@/store/chapters'
import { useUiStore } from '@/store/ui'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu'
import type { ChapterStatus } from '@/types'

const STATUS_ICON: Record<ChapterStatus, string> = {
  planning: '📋', drafting: '✍️', auditing: '🔍', revising: '✏️', confirmed: '✓',
}
const STATUS_COLOR: Record<ChapterStatus, string> = {
  planning: 'text-ctp-subtext0', drafting: 'text-ctp-blue',
  auditing: 'text-ctp-yellow', revising: 'text-ctp-peach', confirmed: 'text-ctp-green',
}

interface Props {
  projectId: string
  expanded: boolean
  onToggle: () => void
}

interface CtxState { uid: string; x: number; y: number }

export default function ChapterList({ projectId, expanded, onToggle }: Props) {
  const { chapters, currentChapterId, setCurrentChapter, createChapter, renameChapter, deleteChapter } = useChaptersStore()
  const setActiveView = useUiStore((s) => s.setActiveView)

  const [ctx, setCtx] = useState<CtxState | null>(null)
  const [renamingUid, setRenamingUid] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creating, setCreating] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (uid: string) => {
    setCurrentChapter(uid)
    setActiveView('editor')
  }

  const handleAddChapter = async () => {
    if (creating) return
    setCreating(true)
    try {
      const n = chapters.length + 1
      const chapter = await createChapter(projectId, `第${n}章`)
      handleSelect(chapter.uid)
    } finally {
      setCreating(false)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, uid: string) => {
    e.preventDefault()
    setCtx({ uid, x: e.clientX, y: e.clientY })
  }

  const startRename = (uid: string, currentTitle: string) => {
    setRenamingUid(uid)
    setRenameValue(currentTitle)
    setTimeout(() => renameInputRef.current?.select(), 30)
  }

  const commitRename = async () => {
    if (renamingUid && renameValue.trim()) {
      await renameChapter(renamingUid, renameValue.trim())
    }
    setRenamingUid(null)
  }

  const ctxItems = (uid: string): ContextMenuItem[] => {
    const ch = chapters.find((c) => c.uid === uid)
    return [
      { label: '重命名', onClick: () => startRename(uid, ch?.title ?? '') },
      { label: '删除', danger: true, onClick: async () => {
        await deleteChapter(uid)
        if (currentChapterId === uid) setActiveView('editor')
      }},
    ]
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
            <div key={ch.uid} onContextMenu={(e) => handleContextMenu(e, ch.uid)}>
              {renamingUid === ch.uid ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingUid(null)
                  }}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-ctp-surface0 border border-ctp-mauve rounded text-ctp-text outline-none"
                  autoFocus
                />
              ) : (
                <button
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
              )}
            </div>
          ))}

          <button
            onClick={handleAddChapter}
            disabled={creating}
            className="w-full text-left px-3 py-1 text-xs text-ctp-overlay0 hover:text-ctp-mauve hover:bg-ctp-surface0 rounded transition-colors pl-7 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            <span>{creating ? '创建中...' : '新建章节'}</span>
          </button>
        </div>
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          items={ctxItems(ctx.uid)}
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  )
}
