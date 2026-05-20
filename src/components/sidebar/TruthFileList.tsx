import { useState } from 'react'
import { Brain } from 'lucide-react'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useProjectsStore } from '@/store/projects'
import { useUiStore } from '@/store/ui'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu'
import type { TruthFileType } from '@/types'

const TRUTH_FILE_LABELS: Record<TruthFileType, string> = {
  worldview:  '世界观账本',
  characters: '人物矩阵',
  resources:  '资源账本',
  hooks:      '悬念钩子',
  summaries:  '章节摘要',
  subplots:   '支线追踪',
  emotional:  '情感弧线',
}

const ALL_TYPES: TruthFileType[] = ['worldview', 'characters', 'resources', 'hooks', 'summaries', 'subplots', 'emotional']

interface Props {
  expanded: boolean
  onToggle: () => void
}

interface CtxState { type: TruthFileType; x: number; y: number }

export default function TruthFileList({ expanded, onToggle }: Props) {
  const { currentType, setCurrentType, updateTruthFile } = useTruthFilesStore()
  const { projects, currentProjectId } = useProjectsStore()
  const setActiveView = useUiStore((s) => s.setActiveView)

  const [ctx, setCtx] = useState<CtxState | null>(null)

  const project = projects.find((p) => p.uid === currentProjectId)

  const handleSelect = (type: TruthFileType) => {
    setCurrentType(type)
    setActiveView('truth-file')
  }

  const handleContextMenu = (e: React.MouseEvent, type: TruthFileType) => {
    e.preventDefault()
    setCtx({ type, x: e.clientX, y: e.clientY })
  }

  const ctxItems = (type: TruthFileType): ContextMenuItem[] => [
    {
      label: '查看/编辑',
      onClick: () => handleSelect(type),
    },
    {
      label: '清空内容',
      danger: true,
      onClick: async () => {
        if (project) await updateTruthFile(project.uid, type, '')
      },
    },
  ]

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ctp-subtext0 hover:text-ctp-text transition-colors"
      >
        <Brain className="w-3.5 h-3.5 flex-shrink-0" />
        <span>故事提纲</span>
        <span className="ml-auto text-ctp-overlay0">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="space-y-0.5 pb-1">
          {ALL_TYPES.map((type) => (
            <div key={type} onContextMenu={(e) => handleContextMenu(e, type)}>
              <button
                onClick={() => handleSelect(type)}
                className={`w-full text-left px-3 py-1 text-xs rounded transition-colors pl-7 ${
                  currentType === type
                    ? 'bg-ctp-mauve/20 text-ctp-mauve'
                    : 'text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text'
                }`}
              >
                {TRUTH_FILE_LABELS[type]}
              </button>
            </div>
          ))}
        </div>
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          items={ctxItems(ctx.type)}
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  )
}
