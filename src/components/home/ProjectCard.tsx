import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { useProjectsStore } from '@/store/projects'
import { db } from '@/db'
import { exportAllChapters } from '@/engine/export'

const GENRE_LABELS: Record<string, string> = {
  xuanhuan: '玄幻/修仙', system: '系统流', urban: '都市',
  scifi: '星际/科幻', history: '历史/穿越', romance: '言情/甜宠',
}
const GENRE_COLORS: Record<string, string> = {
  xuanhuan: 'text-ctp-mauve border-ctp-mauve', system: 'text-ctp-blue border-ctp-blue',
  urban: 'text-ctp-green border-ctp-green',    scifi: 'text-ctp-sky border-ctp-sky',
  history: 'text-ctp-peach border-ctp-peach',  romance: 'text-ctp-pink border-ctp-pink',
}

interface Props { project: Project }

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const { updateProject, deleteProject } = useProjectsStore()

  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(project.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const colorClass = GENRE_COLORS[project.genre] ?? 'text-ctp-text border-ctp-surface1'

  const formatDate = (d: Date) => {
    const date = new Date(d)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen((v) => !v)
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setRenameValue(project.name)
    setRenaming(true)
  }

  const commitRename = async () => {
    if (renameValue.trim() && renameValue.trim() !== project.name) {
      await updateProject(project.uid, { name: renameValue.trim() })
    }
    setRenaming(false)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    const chapters = await db.chapters.where('projectId').equals(project.uid).sortBy('order')
    exportAllChapters(chapters, project)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setConfirmDelete(true)
  }

  const confirmDeleteAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteProject(project.uid)
  }

  return (
    <div className="relative group">
      {/* 卡片主体 */}
      <button
        onClick={() => !renaming && navigate(`/project/${project.uid}`)}
        className="w-full text-left bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-surface1 hover:border-ctp-overlay0 rounded-lg p-4 transition-all duration-150"
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          {renaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm font-semibold bg-ctp-surface1 border border-ctp-mauve rounded px-2 py-0.5 text-ctp-text outline-none"
            />
          ) : (
            <h3 className="text-sm font-semibold text-ctp-text group-hover:text-ctp-mauve transition-colors line-clamp-2 flex-1">
              {project.name}
            </h3>
          )}

          {/* 三点菜单按钮 */}
          <div ref={menuRef} className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleMenuClick}
              className="p-1 rounded text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                {/* 点外部关闭 */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-32 bg-ctp-surface0 border border-ctp-surface1 rounded-lg shadow-xl py-1 z-50">
                  <button onClick={handleRename}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ctp-text hover:bg-ctp-surface1 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> 重命名
                  </button>
                  <button onClick={handleDownload}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ctp-text hover:bg-ctp-surface1 transition-colors">
                    <Download className="w-3.5 h-3.5" /> 下载全文
                  </button>
                  <div className="border-t border-ctp-surface1 my-1" />
                  <button onClick={handleDeleteClick}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ctp-red hover:bg-ctp-red/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> 删除项目
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs border rounded px-1.5 py-0.5 ${colorClass}`}>
            {GENRE_LABELS[project.genre] ?? project.genre}
          </span>
          <span className="text-xs text-ctp-subtext0">{formatDate(project.updatedAt)}</span>
        </div>
      </button>

      {/* 删除确认遮罩 */}
      {confirmDelete && (
        <div
          className="absolute inset-0 rounded-lg bg-ctp-base/90 flex flex-col items-center justify-center gap-3 z-10 border border-ctp-red/40"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-ctp-text text-center px-4">
            删除《{project.name}》？<br />
            <span className="text-ctp-subtext0">所有章节和故事提纲将一并删除</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
              className="px-3 py-1 text-xs bg-ctp-surface1 text-ctp-text rounded hover:bg-ctp-surface0 transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmDeleteAction}
              className="px-3 py-1 text-xs bg-ctp-red text-ctp-base rounded hover:opacity-90 transition-opacity"
            >
              确认删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
