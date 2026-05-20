import { useNavigate } from 'react-router-dom'
import type { Project } from '@/types'

const GENRE_LABELS: Record<string, string> = {
  xuanhuan: '玄幻/修仙',
  system: '系统流',
  urban: '都市',
  scifi: '星际/科幻',
  history: '历史/穿越',
  romance: '言情/甜宠',
}

const GENRE_COLORS: Record<string, string> = {
  xuanhuan: 'text-ctp-mauve border-ctp-mauve',
  system:   'text-ctp-blue border-ctp-blue',
  urban:    'text-ctp-green border-ctp-green',
  scifi:    'text-ctp-sky border-ctp-sky',
  history:  'text-ctp-peach border-ctp-peach',
  romance:  'text-ctp-pink border-ctp-pink',
}

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const colorClass = GENRE_COLORS[project.genre] ?? 'text-ctp-text border-ctp-surface1'

  const formatDate = (d: Date) => {
    const date = new Date(d)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <button
      onClick={() => navigate(`/project/${project.uid}`)}
      className="w-full text-left bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-surface1 hover:border-ctp-overlay0 rounded-lg p-4 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-ctp-text group-hover:text-ctp-mauve transition-colors line-clamp-2">
          {project.name}
        </h3>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs border rounded px-1.5 py-0.5 ${colorClass}`}>
          {GENRE_LABELS[project.genre] ?? project.genre}
        </span>
        <span className="text-xs text-ctp-subtext0">
          {formatDate(project.updatedAt)}
        </span>
      </div>
    </button>
  )
}
