import { useCallback, useRef, useState } from 'react'
import { useUiStore } from '@/store/ui'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useProjectsStore } from '@/store/projects'
import LeftSidebar from './LeftSidebar'
import EditorArea from './EditorArea'
import RightPanel from './RightPanel'
import TruthFileEditor from '@/components/truth-files/TruthFileEditor'
import StyleFingerprintEditor from '@/components/truth-files/StyleFingerprintEditor'
import type { TruthFileType } from '@/types'

const MIN_LEFT = 140
const MAX_LEFT = 320
const MIN_RIGHT = 240
const MAX_RIGHT = 520

function useDragResize(
  initial: number,
  min: number,
  max: number,
  direction: 'left' | 'right',
) {
  const [size, setSize] = useState(initial)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startSize = useRef(initial)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startSize.current = size

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      const next = direction === 'left'
        ? startSize.current + delta
        : startSize.current - delta
      setSize(Math.min(max, Math.max(min, next)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size, min, max, direction])

  return { size, onMouseDown }
}

export default function WorkspaceLayout() {
  const activeView = useUiStore((s) => s.activeView)
  const currentType = useTruthFilesStore((s) => s.currentType)
  const { projects, currentProjectId, updateProject } = useProjectsStore()
  const project = projects.find((p) => p.uid === currentProjectId)

  const left = useDragResize(180, MIN_LEFT, MAX_LEFT, 'left')
  const right = useDragResize(300, MIN_RIGHT, MAX_RIGHT, 'right')

  const centerPanel = (() => {
    if (activeView === 'truth-file' && currentType) {
      return <TruthFileEditor type={currentType as TruthFileType} />
    }
    if (activeView === 'style-fingerprint' && project) {
      return (
        <StyleFingerprintEditor
          projectUid={project.uid}
          currentFingerprint={project.styleFingerprint}
          onUpdate={(fp) => updateProject(project.uid, { styleFingerprint: fp })}
        />
      )
    }
    return <EditorArea />
  })()

  return (
    <div className="h-full w-full flex bg-ctp-base overflow-hidden select-none">
      {/* 左栏 */}
      <div style={{ width: left.size, flexShrink: 0 }} className="h-full overflow-hidden">
        <LeftSidebar />
      </div>

      {/* 左拖拽分隔线 */}
      <div
        onMouseDown={left.onMouseDown}
        className="w-1 h-full flex-shrink-0 bg-ctp-surface0 hover:bg-ctp-mauve/70 active:bg-ctp-mauve transition-colors cursor-col-resize"
      />

      {/* 中间编辑区 */}
      <div className="flex-1 h-full overflow-hidden min-w-0">
        {centerPanel}
      </div>

      {/* 右拖拽分隔线 */}
      <div
        onMouseDown={right.onMouseDown}
        className="w-1 h-full flex-shrink-0 bg-ctp-surface0 hover:bg-ctp-mauve/70 active:bg-ctp-mauve transition-colors cursor-col-resize"
      />

      {/* 右栏 */}
      <div style={{ width: right.size, flexShrink: 0 }} className="h-full overflow-hidden">
        <RightPanel />
      </div>
    </div>
  )
}
