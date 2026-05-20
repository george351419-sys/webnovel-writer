import { Brain } from 'lucide-react'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useUiStore } from '@/store/ui'
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

export default function TruthFileList({ expanded, onToggle }: Props) {
  const { currentType, setCurrentType } = useTruthFilesStore()
  const setActiveView = useUiStore((s) => s.setActiveView)

  const handleSelect = (type: TruthFileType) => {
    setCurrentType(type)
    setActiveView('truth-file')
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ctp-subtext0 hover:text-ctp-text transition-colors"
      >
        <Brain className="w-3.5 h-3.5 flex-shrink-0" />
        <span>真相文件</span>
        <span className="ml-auto text-ctp-overlay0">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="space-y-0.5 pb-1">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={`w-full text-left px-3 py-1 text-xs rounded transition-colors pl-7 ${
                currentType === type
                  ? 'bg-ctp-mauve/20 text-ctp-mauve'
                  : 'text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text'
              }`}
            >
              {TRUTH_FILE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
