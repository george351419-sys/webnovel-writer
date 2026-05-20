import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Bot, ChevronRight, MessageSquare, RotateCcw, Settings, Square, Workflow } from 'lucide-react'
import { useChaptersStore } from '@/store/chapters'
import { useProjectsStore } from '@/store/projects'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useUiStore } from '@/store/ui'
import { useModelConfigStore } from '@/store/modelConfig'
import AuditReport from '@/components/ai-panel/AuditReport'
import ChatPanel from '@/components/ai-panel/ChatPanel'
import { STATUS_LABELS, STEP_ORDER, stepIndex } from '@/engine/pipeline/stateMachine'
import { generateDraft } from '@/engine/pipeline/drafter'
import { runAudit } from '@/engine/audit/auditor'
import { generateRevision } from '@/engine/pipeline/reviser'
import { updateTruthFilesAfterConfirm } from '@/engine/memory/updater'
import type { ChapterStatus } from '@/types'

type View = 'chat' | 'pipeline'

export default function RightPanel() {
  const [view, setView] = useState<View>('chat')

  const { chapters, currentChapterId, updateChapterContent, updateChapterStatus, updateAuditReport } = useChaptersStore()
  const { projects, currentProjectId } = useProjectsStore()
  const { truthFiles, updateTruthFile } = useTruthFilesStore()
  const { setStreamingText } = useUiStore()
  const isConfigured = useModelConfigStore((s) => s.isConfigured)

  const chapter = chapters.find((c) => c.uid === currentChapterId)
  const project = projects.find((p) => p.uid === currentProjectId)

  const [planGoal, setPlanGoal] = useState('')
  const [planWordTarget, setPlanWordTarget] = useState(3000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentStep = chapter ? stepIndex(chapter.status) : 0

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleRollback = () => {
    if (loading || !chapter) return
    const prevStatus = STEP_ORDER[currentStep - 1] as ChapterStatus | undefined
    if (prevStatus) {
      updateChapterStatus(chapter.uid, prevStatus)
      setError(null)
    }
  }

  const handleToggleIssue = (idx: number) => {
    if (!chapter) return
    const updated = chapter.auditReport.map((issue, i) =>
      i === idx ? { ...issue, resolved: !issue.resolved } : issue
    )
    updateAuditReport(chapter.uid, updated)
  }

  const handleAction = async () => {
    if (!chapter || !project) return
    if (!isConfigured()) {
      setError('请先配置 API Key')
      return
    }
    setError(null)
    setLoading(true)
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    try {
      if (chapter.status === 'planning') {
        const goal = planGoal.trim() || chapter.plan.goal
        const wordTarget = planWordTarget || chapter.plan.wordTarget
        setStreamingText('')

        const full = await generateDraft({
          chapter: { ...chapter, plan: { ...chapter.plan, goal, wordTarget } },
          project,
          truthFiles,
          allChapters: chapters,
          onChunk: (accumulated) => setStreamingText(accumulated),
          signal,
        })

        await updateChapterContent(chapter.uid, 'draft', full)
        setStreamingText(null)
        await updateChapterStatus(chapter.uid, 'drafting')

      } else if (chapter.status === 'drafting') {
        const content = chapter.draft || chapter.final
        const issues = await runAudit(content, project.genre)
        await updateAuditReport(chapter.uid, issues)
        await updateChapterStatus(chapter.uid, 'auditing')

      } else if (chapter.status === 'auditing') {
        setStreamingText('')

        const full = await generateRevision({
          chapter,
          onChunk: (accumulated) => setStreamingText(accumulated),
          signal,
        })

        await updateChapterContent(chapter.uid, 'revised', full)
        setStreamingText(null)
        await updateChapterStatus(chapter.uid, 'revising')

      } else if (chapter.status === 'revising') {
        const updates = await updateTruthFilesAfterConfirm({
          chapter,
          project,
          currentTruthFiles: truthFiles,
        })

        for (const [type, content] of updates.entries()) {
          await updateTruthFile(project.uid, type, content)
        }
        await updateChapterStatus(chapter.uid, 'confirmed')
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || '操作失败，请重试')
      }
      setStreamingText(null)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const actionLabel: Record<ChapterStatus, string> = {
    planning:  '生成草稿',
    drafting:  '开始审稿',
    auditing:  '开始修订',
    revising:  '确认本章',
    confirmed: '',
  }

  return (
    <aside className="w-full h-full flex flex-col bg-ctp-mantle border-l border-ctp-surface0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ctp-surface0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {view === 'chat' ? (
            <Bot className="w-4 h-4 text-ctp-blue" />
          ) : (
            <Workflow className="w-4 h-4 text-ctp-blue" />
          )}
          <span className="text-sm font-medium text-ctp-text">
            {view === 'chat' ? 'AI 助手' : '写作流水线'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {view === 'pipeline' && chapter && currentStep > 0 && !loading && (
            <button
              onClick={handleRollback}
              className="text-ctp-subtext0 hover:text-ctp-text transition-colors p-1 rounded hover:bg-ctp-surface0"
              title="回到上一步"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Toggle view button */}
          <button
            onClick={() => setView(view === 'chat' ? 'pipeline' : 'chat')}
            className={`p-1 rounded transition-colors ${
              view === 'pipeline'
                ? 'text-ctp-blue bg-ctp-blue/10'
                : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0'
            }`}
            title={view === 'chat' ? '切换到流水线' : '切换到 AI 对话'}
          >
            {view === 'chat' ? (
              <Workflow className="w-3.5 h-3.5" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Chat view */}
      {view === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {!project ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-ctp-subtext0 text-center px-4">
                从左侧选择章节
                <br />
                开启 AI 写作助手
              </p>
            </div>
          ) : (
            <ChatPanel />
          )}
        </div>
      )}

      {/* Pipeline view */}
      {view === 'pipeline' && (
        <>
          {!chapter || !project ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-ctp-subtext0 text-center px-4">
                从左侧选择章节
                <br />
                开启写作流水线
              </p>
            </div>
          ) : (
            <>
              {/* 流水线进度 */}
              <div className="px-4 py-4 border-b border-ctp-surface0 flex-shrink-0">
                <div className="space-y-2">
                  {STEP_ORDER.map((status, idx) => {
                    const isDone = idx < currentStep
                    const isCurrent = idx === currentStep
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isDone
                            ? 'bg-ctp-green text-ctp-base'
                            : isCurrent
                              ? `bg-ctp-blue text-ctp-base${loading ? ' animate-pulse' : ''}`
                              : 'bg-ctp-surface1 text-ctp-subtext0'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className={`text-xs ${
                          isDone ? 'text-ctp-green line-through' :
                          isCurrent ? 'text-ctp-blue font-medium' :
                          'text-ctp-subtext0'
                        }`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 当前步骤内容 */}
              <div className="flex-1 overflow-y-auto p-4">
                {!isConfigured() && (
                  <div className="mb-3 px-3 py-2 rounded bg-ctp-yellow/10 border border-ctp-yellow/30 text-xs text-ctp-yellow">
                    ⚡ 当前无 AI 配置，流水线功能不可用
                  </div>
                )}
                {error && (
                  <div className="mb-3 px-3 py-2 rounded bg-ctp-red/10 border border-ctp-red/30 text-xs text-ctp-red">
                    {error}
                  </div>
                )}

                {chapter.status === 'planning' && !loading && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-ctp-text">章节规划</h3>
                    <div>
                      <label className="text-xs text-ctp-subtext0 mb-1 block">本章目标</label>
                      <textarea
                        value={planGoal || chapter.plan.goal}
                        onChange={(e) => setPlanGoal(e.target.value)}
                        placeholder="这章要推进哪些情节？"
                        className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-3 py-2 text-xs outline-none focus:border-ctp-mauve resize-none h-20"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ctp-subtext0 mb-1 block">目标字数</label>
                      <input
                        type="number"
                        value={planWordTarget || chapter.plan.wordTarget}
                        onChange={(e) => setPlanWordTarget(Number(e.target.value))}
                        className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-3 py-2 text-xs outline-none focus:border-ctp-mauve"
                      />
                    </div>
                  </div>
                )}

                {chapter.status === 'planning' && loading && (
                  <p className="text-xs text-ctp-subtext0">正在生成草稿，请稍候...</p>
                )}

                {chapter.status === 'drafting' && !loading && (
                  <div className="space-y-2">
                    <p className="text-xs text-ctp-subtext1">草稿已生成，请在编辑器中查看。</p>
                    <p className="text-xs text-ctp-subtext0 mt-1">确认无误后点击「开始审稿」继续。</p>
                  </div>
                )}

                {chapter.status === 'drafting' && loading && (
                  <p className="text-xs text-ctp-subtext0">正在进行33维审稿，请稍候...</p>
                )}

                {chapter.status === 'auditing' && !loading && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-ctp-text">
                      审稿报告
                      {chapter.auditReport.length > 0 && (
                        <span className="ml-2 text-ctp-subtext0 font-normal">
                          ({chapter.auditReport.filter((i) => !i.resolved).length} 待修)
                        </span>
                      )}
                    </h3>
                    {chapter.auditReport.length === 0
                      ? <p className="text-xs text-ctp-subtext0">暂无审稿报告，请先点击「开始审稿」。</p>
                      : <AuditReport issues={chapter.auditReport} onToggle={handleToggleIssue} />
                    }
                  </div>
                )}

                {chapter.status === 'auditing' && loading && (
                  <p className="text-xs text-ctp-subtext0">正在进行33维审稿，请稍候...</p>
                )}

                {chapter.status === 'revising' && !loading && (
                  <div className="space-y-2">
                    <p className="text-xs text-ctp-subtext1">修订稿已生成，请在编辑器中查看。</p>
                    <p className="text-xs text-ctp-subtext0 mt-1">满意后点击「确认本章」完成并更新故事提纲。</p>
                  </div>
                )}

                {chapter.status === 'revising' && loading && (
                  <p className="text-xs text-ctp-subtext0">正在生成修订稿，请稍候...</p>
                )}

                {chapter.status === 'confirmed' && (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">🎉</div>
                    <p className="text-xs text-ctp-green font-semibold">本章已确认完成</p>
                    <p className="text-xs text-ctp-subtext0 mt-1">故事提纲已自动更新</p>
                  </div>
                )}
              </div>

              {/* 底部操作按钮 */}
              {chapter.status !== 'confirmed' && (
                <div className="p-4 border-t border-ctp-surface0 flex-shrink-0">
                  {!isConfigured() ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-ctp-red/10 border border-ctp-red/30">
                        <AlertCircle className="w-4 h-4 text-ctp-red flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-ctp-red">未配置 AI 模型</p>
                          <p className="text-xs text-ctp-subtext1 mt-0.5">需要先填写 API Key 才能使用写作流水线</p>
                        </div>
                      </div>
                      <Link
                        to="/settings"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ctp-mauve text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        去设置
                      </Link>
                    </div>
                  ) : loading ? (
                    <button
                      onClick={handleStop}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ctp-red/80 text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Square className="w-3.5 h-3.5" />
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={handleAction}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ctp-blue text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>{actionLabel[chapter.status]}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </aside>
  )
}
