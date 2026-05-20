import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, BookOpen, Settings } from 'lucide-react'
import { useProjectsStore } from '@/store/projects'
import ProjectCard from '@/components/home/ProjectCard'
import EmptyState from '@/components/home/EmptyState'

export default function Home() {
  const { projects, loading, loadProjects } = useProjectsStore()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="h-full bg-ctp-base text-ctp-text flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-ctp-surface0 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-ctp-mauve" />
          <h1 className="text-base font-bold text-ctp-text">WebNovel Writer</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ctp-mauve text-ctp-base rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            新建项目
          </Link>
          <Link to="/settings" className="text-ctp-subtext1 hover:text-ctp-text transition-colors p-1.5 rounded hover:bg-ctp-surface0">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-ctp-subtext1 text-sm">加载中...</span>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-ctp-subtext1">
                全部项目（{projects.length}）
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard key={project.uid} project={project} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
