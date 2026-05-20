import type { AuditIssue } from '@/types'

const SEVERITY_COLOR = {
  high:   'border-l-ctp-red text-ctp-red',
  medium: 'border-l-ctp-yellow text-ctp-yellow',
  low:    'border-l-ctp-subtext0 text-ctp-subtext0',
}

const SEVERITY_LABEL = { high: '高', medium: '中', low: '低' }

interface Props {
  issues: AuditIssue[]
  onToggle: (idx: number) => void
}

export default function AuditReport({ issues, onToggle }: Props) {
  if (issues.length === 0) {
    return <p className="text-xs text-ctp-subtext0 text-center py-4">暂无审稿问题</p>
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, idx) => (
        <div
          key={idx}
          className={`border-l-2 pl-3 pr-2 py-2 rounded-r bg-ctp-surface0 ${SEVERITY_COLOR[issue.severity]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">[{SEVERITY_LABEL[issue.severity]}] {issue.dimension}</span>
            <button
              onClick={() => onToggle(idx)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                issue.resolved
                  ? 'bg-ctp-green/20 text-ctp-green'
                  : 'bg-ctp-surface1 text-ctp-subtext0 hover:bg-ctp-overlay0'
              }`}
            >
              {issue.resolved ? '已修复' : '待修复'}
            </button>
          </div>
          <p className="text-xs text-ctp-subtext1 leading-relaxed">{issue.description}</p>
          {issue.suggestion && (
            <p className="text-xs text-ctp-overlay2 mt-1 italic">{issue.suggestion}</p>
          )}
        </div>
      ))}
    </div>
  )
}
