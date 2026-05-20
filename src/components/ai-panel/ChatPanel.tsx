import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowRight, Bot, Check, FileText, Loader2, SendHorizontal, Square } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useChaptersStore } from '@/store/chapters'
import { useProjectsStore } from '@/store/projects'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useModelConfigStore } from '@/store/modelConfig'
import { useUiStore } from '@/store/ui'
import { sendChatMessage } from '@/engine/chat/chatEngine'
import { parseMessage, ACTION_LABELS, ACTION_TRUTH_FILE_MAP } from '@/engine/chat/messageParser'
import type { ActionBlock, ActionType } from '@/engine/chat/messageParser'
import type { TruthFileType } from '@/types'

type NavTarget =
  | { kind: 'chapter'; uid: string; title: string }
  | { kind: 'truth-file'; fileType: TruthFileType; label: string }

// 纯文本 → HTML 段落
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('')
}

type BlockStatus = 'pending' | 'running' | 'done' | 'error'

// 纯展示组件，状态由父组件控制
interface ActionCardProps {
  block: ActionBlock
  status: BlockStatus
  navTarget?: NavTarget
  onNavigate?: (nav: NavTarget) => void
}

function ActionCard({ block, status, navTarget, onNavigate }: ActionCardProps) {
  const label = ACTION_LABELS[block.type]
  const summary =
    block.type === 'create_chapter'
      ? `《${block.content.trim()}》`
      : block.type === 'write_chapter_draft'
        ? `${block.content.trim().length} 字`
        : ''

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
      status === 'done'      ? 'bg-ctp-green/10 border-ctp-green/30 text-ctp-green'
      : status === 'error'   ? 'bg-ctp-red/10 border-ctp-red/30 text-ctp-red'
      : status === 'running' ? 'bg-ctp-blue/10 border-ctp-blue/30 text-ctp-blue'
      : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext1'
    }`}>
      {status === 'done'     ? <Check className="w-3 h-3 flex-shrink-0" />
       : status === 'running' ? <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
       : status === 'error'   ? <span>✗</span>
       : <FileText className="w-3 h-3 flex-shrink-0" />}
      <span className="flex-1">{label}{summary ? ` ${summary}` : ''}</span>
      {status === 'done' && navTarget && onNavigate && (
        <button
          onClick={() => onNavigate(navTarget)}
          className="ml-1 flex items-center gap-0.5 text-xs opacity-70 hover:opacity-100 transition-opacity underline underline-offset-2"
        >
          查看 <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default function ChatPanel() {
  const { messages, isStreaming, addUserMessage, addAssistantMessage, appendChunk, finalizeMessage, setStreaming } = useChatStore()
  const { chapters, currentChapterId, createChapter, setCurrentChapter, updateChapterContent } = useChaptersStore()
  const { projects, currentProjectId } = useProjectsStore()
  const { truthFiles, updateTruthFile, setCurrentType } = useTruthFilesStore()
  const isConfigured = useModelConfigStore((s) => s.isConfigured)
  const { setActiveView, setStreamingText } = useUiStore()

  const chapter = chapters.find((c) => c.uid === currentChapterId) ?? null
  const project = projects.find((p) => p.uid === currentProjectId) ?? null

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // key: `${messageId}-${blockIndex}`
  const [blockStatuses, setBlockStatuses] = useState<Record<string, BlockStatus>>({})
  const [navTargets, setNavTargets] = useState<Record<string, NavTarget>>({})
  const executedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 点击「查看」按钮时的导航处理
  const handleNavigate = useCallback((nav: NavTarget) => {
    if (nav.kind === 'chapter') {
      setCurrentChapter(nav.uid)
      setActiveView('editor')
    } else {
      setCurrentType(nav.fileType)
      setActiveView('truth-file')
    }
  }, [setCurrentChapter, setActiveView, setCurrentType])

  // 单条 block 执行器，返回导航目标
  const executeBlock = useCallback(async (
    block: ActionBlock,
    context: { projectId: string; lastCreatedChapterId: { current: string | null } }
  ): Promise<NavTarget | null> => {
    const { projectId, lastCreatedChapterId } = context

    if (block.type === 'create_chapter') {
      const title = block.content.trim() || '新章节'
      const newChapter = await createChapter(projectId, title)
      lastCreatedChapterId.current = newChapter.uid
      setCurrentChapter(newChapter.uid)
      setActiveView('editor')
      return { kind: 'chapter', uid: newChapter.uid, title }

    } else if (block.type === 'write_chapter_draft') {
      const targetId = lastCreatedChapterId.current ?? useChaptersStore.getState().currentChapterId
      if (targetId) {
        const html = textToHtml(block.content.trim())
        setActiveView('editor')
        // 逐字流式显示在中间编辑区，每帧 15 字，约 1-2s 完成 2000 字
        await new Promise<void>((resolve) => {
          let pos = 0
          const tick = () => {
            pos = Math.min(pos + 15, html.length)
            setStreamingText(html.slice(0, pos))
            if (pos < html.length) setTimeout(tick, 16)
            else resolve()
          }
          tick()
        })
        await updateChapterContent(targetId, 'draft', html)
        setTimeout(() => setStreamingText(null), 80)
        const title = useChaptersStore.getState().chapters.find(c => c.uid === targetId)?.title ?? '章节'
        return { kind: 'chapter', uid: targetId, title }
      }
    } else {
      const truthFileType = ACTION_TRUTH_FILE_MAP[block.type as ActionType]
      if (truthFileType) {
        await updateTruthFile(projectId, truthFileType as TruthFileType, block.content.trim())
        const TRUTH_LABELS: Record<TruthFileType, string> = {
          worldview: '世界观账本', characters: '人物矩阵', resources: '资源账本',
          hooks: '悬念钩子', summaries: '章节摘要', subplots: '支线追踪', emotional: '情感弧线',
        }
        return { kind: 'truth-file', fileType: truthFileType, label: TRUTH_LABELS[truthFileType] }
      }
    }
    return null
  }, [createChapter, setCurrentChapter, updateChapterContent, updateTruthFile, setActiveView, setStreamingText])

  // 流式结束后，执行还未被流式处理的 ACTION 块（如 write_worldview 等）
  useEffect(() => {
    if (isStreaming) return
    const latestMsg = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isStreaming)
    if (!latestMsg || executedRef.current.has(latestMsg.id)) return

    const segments = parseMessage(latestMsg.content)
    const actionBlocks = segments
      .map((s, i) => ({ seg: s, idx: i }))
      .filter(({ seg }) => seg.type === 'action')

    if (actionBlocks.length === 0) return
    if (!project) return

    executedRef.current.add(latestMsg.id)
    const msgId = latestMsg.id
    const lastCreatedChapterId = { current: null as string | null }

    setBlockStatuses((prev) => {
      const next = { ...prev }
      actionBlocks.forEach(({ idx }) => {
        const key = `${msgId}-${idx}`
        // 已被流式阶段处理的跳过，直接标为 done
        if (!next[key]) next[key] = 'pending'
      })
      return next
    })

    ;(async () => {
      for (const { seg, idx } of actionBlocks) {
        if (seg.type !== 'action') continue
        const key = `${msgId}-${idx}`
        // 已在流式阶段标为 done → 跳过，只补充 navTarget
        if (blockStatuses[key] === 'done') {
          continue
        }
        setBlockStatuses((prev) => ({ ...prev, [key]: 'running' }))
        try {
          const nav = await executeBlock(seg.block, { projectId: project.uid, lastCreatedChapterId })
          setBlockStatuses((prev) => ({ ...prev, [key]: 'done' }))
          if (nav) setNavTargets((prev) => ({ ...prev, [key]: nav }))
        } catch {
          setBlockStatuses((prev) => ({ ...prev, [key]: 'error' }))
        }
      }
    })()
  }, [isStreaming, messages, project, executeBlock])  // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || !project) return

    addUserMessage(content.trim())
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const history = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    setStreaming(true)
    const assistantId = addAssistantMessage()
    abortRef.current = new AbortController()

    // ─── 实时流式解析状态机 ───
    type StreamMode = 'chat' | 'in_create' | 'in_draft' | 'in_other'
    const ctx = {
      mode: 'chat' as StreamMode,
      lineBuffer: '',
      fullOutput: '',       // 最终存入消息的完整内容（chat文本 + ACTION块）
      blockBuf: '',         // 当前 ACTION 块的内容
      currentType: '',      // 当前 ACTION 类型
      lastCreatedId: null as string | null,
      pendingCreate: null as Promise<void> | null,
      draftCharCount: 0,
    }

    const flushLine = (line: string) => {
      const actionStart = line.match(/^---ACTION:(\w+)---$/)
      if (actionStart) {
        const type = actionStart[1]
        ctx.mode = type === 'create_chapter' ? 'in_create'
          : type === 'write_chapter_draft' ? 'in_draft'
          : 'in_other'
        ctx.currentType = type
        ctx.blockBuf = ''
        // 进入草稿模式：立即切换到编辑区并清空流式文本
        if (ctx.mode === 'in_draft') {
          setActiveView('editor')
          setStreamingText('')
        }
        return
      }

      if (line === '---END---') {
        const content = ctx.blockBuf.trim()
        if (ctx.mode === 'in_create') {
          const title = content || '新章节'
          ctx.pendingCreate = (async () => {
            const ch = await createChapter(project.uid, title)
            ctx.lastCreatedId = ch.uid
            setCurrentChapter(ch.uid)
            setActiveView('editor')
          })()
          ctx.fullOutput += `---ACTION:create_chapter---\n${title}\n---END---\n`
        } else if (ctx.mode === 'in_draft') {
          ctx.draftCharCount = content.length
          const draftHtml = textToHtml(content)
          const capturedId = ctx.lastCreatedId  // 闭包捕获
          const pendingRef = ctx.pendingCreate
          ;(async () => {
            if (pendingRef) await pendingRef     // 等章节建完
            const targetId = capturedId ?? useChaptersStore.getState().currentChapterId
            if (targetId) {
              await updateChapterContent(targetId, 'draft', draftHtml)
              setTimeout(() => setStreamingText(null), 80)
            }
          })()
          // 存入消息：保留 content 供 ActionCard 计算字数
          ctx.fullOutput += `---ACTION:write_chapter_draft---\n${content}\n---END---\n`
        } else {
          // 其他 ACTION（write_worldview 等）：存入消息，交给流式结束后的执行器
          ctx.fullOutput += `---ACTION:${ctx.currentType}---\n${content}\n---END---\n`
        }
        ctx.mode = 'chat'
        ctx.blockBuf = ''
        ctx.currentType = ''
        appendChunk(assistantId, ctx.fullOutput)
        return
      }

      // 普通内容行
      if (ctx.mode === 'chat') {
        ctx.fullOutput += line + '\n'
        appendChunk(assistantId, ctx.fullOutput)
      } else if (ctx.mode === 'in_draft') {
        ctx.blockBuf += line + '\n'
        // 实时流入中间编辑区
        setStreamingText(textToHtml(ctx.blockBuf))
      } else {
        ctx.blockBuf += line + '\n'
      }
    }

    let prevLen = 0
    const onChunk = (accumulated: string) => {
      const delta = accumulated.slice(prevLen)
      prevLen = accumulated.length
      ctx.lineBuffer += delta
      const lines = ctx.lineBuffer.split('\n')
      ctx.lineBuffer = lines.pop() ?? ''
      for (const line of lines) flushLine(line)
    }
    // ─── 状态机结束 ───

    try {
      await sendChatMessage({
        userMessage: content.trim(),
        history,
        project,
        chapter,
        truthFiles,
        onChunk,
        signal: abortRef.current.signal,
      })
      // 处理末尾未换行的内容
      if (ctx.lineBuffer.trim()) {
        flushLine(ctx.lineBuffer)
        ctx.lineBuffer = ''
      }
      // 流式结束后，把 create_chapter 和 write_chapter_draft 对应的 block 标为 done
      // 让 post-stream useEffect 跳过它们
      const finalSegments = parseMessage(ctx.fullOutput)
      const msgId = assistantId
      finalSegments.forEach((seg, idx) => {
        if (seg.type === 'action' &&
            (seg.block.type === 'create_chapter' || seg.block.type === 'write_chapter_draft')) {
          const key = `${msgId}-${idx}`
          setBlockStatuses((prev) => ({ ...prev, [key]: 'done' }))
          // 设置 navTarget
          if (seg.block.type === 'create_chapter' && ctx.lastCreatedId) {
            setNavTargets((prev) => ({ ...prev, [key]: { kind: 'chapter', uid: ctx.lastCreatedId!, title: seg.block.content.trim() } }))
          } else if (seg.block.type === 'write_chapter_draft') {
            const targetId = ctx.lastCreatedId ?? useChaptersStore.getState().currentChapterId
            const title = useChaptersStore.getState().chapters.find(c => c.uid === targetId)?.title ?? '章节'
            if (targetId) setNavTargets((prev) => ({ ...prev, [key]: { kind: 'chapter', uid: targetId, title } }))
          }
        }
      })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        appendChunk(assistantId, ctx.fullOutput + '\n抱歉，发生了错误，请重试。')
      }
      setStreamingText(null)
    } finally {
      finalizeMessage(assistantId)
      setStreaming(false)
      abortRef.current = null
    }
  }, [isStreaming, project, messages, chapter, truthFiles, addUserMessage, addAssistantMessage, appendChunk, finalizeMessage, setStreaming, createChapter, setCurrentChapter, updateChapterContent, setActiveView, setStreamingText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 40), 120)}px`
  }

  const quickActions = chapter
    ? [
        { label: '⚡ 生成草稿', message: `请帮我为《${chapter.title}》生成草稿，本章目标：${chapter.plan.goal || '未设置'}，目标字数约 ${chapter.plan.wordTarget} 字` },
        { label: '🔍 审稿', message: `请审阅《${chapter.title}》的草稿，指出需要改进的地方` },
        { label: '✏️ 修订', message: `请根据之前的审稿意见，修订《${chapter.title}》的草稿` },
      ]
    : [
        { label: '📖 创建第一章', message: '请帮我创建小说的第一章，并生成一段草稿内容' },
        { label: '🌍 设计世界观', message: '请帮我设计这部小说的世界观背景' },
        { label: '👥 创建人物', message: '请帮我创建主要人物的档案' },
      ]

  return (
    <div className="flex flex-col h-full">
      {/* 快捷操作 */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-ctp-surface0 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              disabled={isStreaming || !isConfigured()}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs bg-ctp-surface1 text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Bot className="w-8 h-8 text-ctp-surface2" />
            <p className="text-xs text-ctp-subtext0 leading-relaxed">
              你好！我是你的网文写作 Agent，
              <br />
              我会直接创建章节、写草稿，而不只是聊天。
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed break-words bg-ctp-mauve/20 text-ctp-text whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              )
            }

            const segments = parseMessage(msg.content)
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%] space-y-1.5">
                  {segments.map((seg, i) => {
                    if (seg.type === 'text') {
                      return seg.content.trim() ? (
                        <div key={i} className="bg-ctp-surface0 text-ctp-text px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {seg.content}
                        </div>
                      ) : null
                    }
                    const key = `${msg.id}-${i}`
                    const status: BlockStatus = msg.isStreaming
                      ? 'pending'
                      : (blockStatuses[key] ?? 'pending')
                    return <ActionCard key={i} block={seg.block} status={status} navTarget={navTargets[key]} onNavigate={handleNavigate} />
                  })}
                  {msg.isStreaming && (
                    <span className="inline-block w-0.5 h-4 bg-ctp-mauve animate-pulse ml-1 align-text-bottom" />
                  )}
                </div>
              </div>
            )
          })
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ctp-surface0 text-ctp-subtext1 text-xs">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ctp-mauve animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ctp-mauve animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ctp-mauve animate-bounce [animation-delay:300ms]" />
              </span>
              AI 正在思考...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="flex-shrink-0 border-t border-ctp-surface0 p-3">
        {!isConfigured() && (
          <div className="mb-2 px-3 py-1.5 rounded bg-ctp-yellow/10 border border-ctp-yellow/30 text-xs text-ctp-yellow">
            需要先配置 API Key
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="让 Agent 帮你创建章节、写草稿..."
            disabled={isStreaming || !project}
            rows={2}
            className="flex-1 resize-none bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-3 py-2 text-xs outline-none focus:border-ctp-mauve placeholder:text-ctp-subtext0 disabled:opacity-50 disabled:cursor-not-allowed leading-5"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {isStreaming ? (
            <button onClick={() => abortRef.current?.abort()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-ctp-red/80 text-ctp-base hover:opacity-90">
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => sendMessage(input)}
              disabled={!input.trim() || !isConfigured() || !project}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-ctp-mauve text-ctp-base hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              <SendHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
