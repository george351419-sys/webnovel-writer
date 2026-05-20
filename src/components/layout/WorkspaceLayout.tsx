import { useUiStore } from '@/store/ui'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useProjectsStore } from '@/store/projects'
import LeftSidebar from './LeftSidebar'
import EditorArea from './EditorArea'
import RightPanel from './RightPanel'
import TruthFileEditor from '@/components/truth-files/TruthFileEditor'
import StyleFingerprintEditor from '@/components/truth-files/StyleFingerprintEditor'
import type { TruthFileType } from '@/types'

export default function WorkspaceLayout() {
  const activeView = useUiStore((s) => s.activeView)
  const currentType = useTruthFilesStore((s) => s.currentType)
  const { projects, currentProjectId, updateProject } = useProjectsStore()
  const project = projects.find((p) => p.uid === currentProjectId)

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
    <div className="h-full w-full flex bg-ctp-base overflow-hidden">
      <LeftSidebar />
      {centerPanel}
      <RightPanel />
    </div>
  )
}
