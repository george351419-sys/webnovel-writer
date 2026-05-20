import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Home, Fingerprint } from 'lucide-react'
import { useProjectsStore } from '@/store/projects'
import { useChaptersStore } from '@/store/chapters'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useUiStore } from '@/store/ui'
import TruthFileList from '@/components/sidebar/TruthFileList'
import ChapterList from '@/components/sidebar/ChapterList'

export default function LeftSidebar() {
  const { id: projectId } = useParams<{ id: string }>()
  const projects = useProjectsStore((s) => s.projects)
  const loadChapters = useChaptersStore((s) => s.loadChapters)
  const ensureTruthFiles = useTruthFilesStore((s) => s.ensureTruthFiles)
  const { activeView, setActiveView } = useUiStore()

  const [truthExpanded, setTruthExpanded] = useState(true)
  const [chapterExpanded, setChapterExpanded] = useState(true)

  const project = projects.find((p) => p.uid === projectId)

  useEffect(() => {
    if (projectId) {
      loadChapters(projectId)
      ensureTruthFiles(projectId)
    }
  }, [projectId, loadChapters, ensureTruthFiles])

  return (
    <aside className="w-full h-full flex flex-col bg-ctp-mantle border-r border-ctp-surface0 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-ctp-surface0 flex items-center gap-2 flex-shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-ctp-mauve flex-shrink-0" />
        <span className="text-xs font-semibold text-ctp-text truncate">
          {project?.name ?? '项目'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        <TruthFileList
          expanded={truthExpanded}
          onToggle={() => setTruthExpanded((v) => !v)}
        />
        {projectId && (
          <ChapterList
            projectId={projectId}
            expanded={chapterExpanded}
            onToggle={() => setChapterExpanded((v) => !v)}
          />
        )}

        {/* Style Fingerprint entry */}
        <div className="mt-1 border-t border-ctp-surface0 pt-1">
          <button
            type="button"
            onClick={() =>
              setActiveView(activeView === 'style-fingerprint' ? 'editor' : 'style-fingerprint')
            }
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
              activeView === 'style-fingerprint'
                ? 'bg-ctp-surface0 text-ctp-mauve'
                : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0'
            }`}
          >
            <Fingerprint className="w-3 h-3 flex-shrink-0" />
            <span>风格指纹</span>
          </button>
        </div>
      </nav>

      <div className="border-t border-ctp-surface0 p-2 flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 rounded transition-colors"
        >
          <Home className="w-3 h-3" />
          <span>返回首页</span>
        </Link>
      </div>
    </aside>
  )
}
