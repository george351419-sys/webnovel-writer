import { Link } from 'react-router-dom'
import { PenLine } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-ctp-surface0 rounded-full flex items-center justify-center mb-4">
        <PenLine className="w-8 h-8 text-ctp-mauve" />
      </div>
      <h3 className="text-lg font-semibold text-ctp-text mb-2">开始你的网文之旅</h3>
      <p className="text-sm text-ctp-subtext1 mb-6 max-w-xs">
        创建你的第一个项目，配置 AI 模型，开启 5 段写作流水线
      </p>
      <Link
        to="/new"
        className="px-5 py-2.5 bg-ctp-mauve text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        新建项目
      </Link>
    </div>
  )
}
