import { useEffect, useRef, useState, useCallback } from 'react'
import { Bot, Check, FileText, Loader2, SendHorizontal, Square } from 'lucide-react'
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

interface ActionCardProps {
  block: ActionBlock
  isStreaming: boolean
  onExecute: (block: ActionBlock) => Promise<void>
}

function ActionCard({ block, isStreaming, onExecute }: ActionCardProps) {
  const [status, setStatus] = useState<'pending' | 'running' | 'done' | 'error'>('pending')
  const executed = useRef(false)

  useEffect(() => {
    if (!isStreaming && status === 'pending' && !executed.current) {
      executed.current = true
      setStatus('running')
      onExecute(block)
        .then(() => setStatus('done'))
        .catch(() => setStatus('error'))
    }
  }, [isStreaming])

  const label = ACTION_LABELS[block.type]

  const summary =
    block.type === 'create_chapter'
      ? `《${block.content.trim()}》`
      : block.type === 'write_chapter_draft'
        ? `${block.content.trim().length} 字`
        : ''

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        status === 'done'
          ? 'bg-ctp-green/10 border-ctp-green/30 text-ctp-green'
          : status === 'error'
            ? 'bg-ctp-red/10 border-ctp-red/30 text-ctp-red'
            : status === 'running'
              ? 'bg-ctp-blue/10 border-ctp-blue/30 text-ctp-blue'
              : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext1'
      }`}
    >
      {status === 'done' ? (
        <Check className="w-3 h-3 flex-shrink-0" />
      ) : status === 'running' ? (
        <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
      ) : status === 'error' ? (
        <span className="text-xs">✗</span>
      ) : (
        <FileText className="w-3 h-3 flex-shrink-0" />
      )}
      <span>
        {label}
        {summary ? ` ${summary}` : ''}
      </span>
    </div>
  )
}

export default function ChatPanel() {
  const {
    messages,
    isStreaming,
    addUserMessage,
    addAssistantMessage,
    appendChunk,
    finalizeMessage,
    setStreaming,
  } = useChatStore()
  const { chapters, currentChapterId, createChapter, setCurrentChapter, updateChapterContent } =
    useChaptersStore()
  const { projects, currentProjectId } = useProjectsStore()
  const { truthFiles, updateTruthFile } = useTruthFilesStore()
  const isConfigured = useModelConfigStore((s) => s.isConfigured)
  const setActiveView = useUiStore((s) => s.setActiveView)

  const chapter = chapters.find((c) => c.uid === currentChapterId) ?? null
  const project = projects.find((p) => p.uid === currentProjectId) ?? null

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Track the last created chapter uid so write_chapter_draft can target it
  const lastCreatedChapterIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    const lineHeight = 20
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 6
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
  }

  const handleExecuteAction = useCallback(
    async (block: ActionBlock) => {
      if (!project) return

      if (block.type === 'create_chapter') {
        const title = block.content.trim() || '新章节'
        const newChapter = await createChapter(project.uid, title)
        lastCreatedChapterIdRef.current = newChapter.uid
        setCurrentChapter(newChapter.uid)
        setActiveView('editor')
      } else if (block.type === 'write_chapter_draft') {
        // Prefer the chapter just created in this response, fallback to current
        const targetId =
          lastCreatedChapterIdRef.current ?? useChaptersStore.getState().currentChapterId
        if (targetId) {
          await updateChapterContent(targetId, 'draft', block.content.trim())
          setActiveView('editor')
        }
      } else {
        const truthFileType = ACTION_TRUTH_FILE_MAP[block.type as ActionType]
        if (truthFileType) {
          await updateTruthFile(project.uid, truthFileType as TruthFileType, block.content.trim())
        }
      }
    },
    [
      project,
      createChapter,
      setCurrentChapter,
      updateChapterContent,
      updateTruthFile,
      setActiveView,
    ],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !project) return

      // Reset the last-created chapter tracker for each new exchange
      lastCreatedChapterIdRef.current = null

      addUserMessage(content.trim())
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      const history = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      setStreaming(true)
      const assistantId = addAssistantMessage()
      abortRef.current = new AbortController()

      try {
        await sendChatMessage({
          userMessage: content.trim(),
          history,
          project,
          chapter,
          truthFiles,
          onChunk: (accumulated) => appendChunk(assistantId, accumulated),
          signal: abortRef.current.signal,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          appendChunk(assistantId, '抱歉，发生了错误，请重试。')
        }
      } finally {
        finalizeMessage(assistantId)
        setStreaming(false)
        abortRef.current = null
      }
    },
    [
      isStreaming,
      project,
      messages,
      chapter,
      truthFiles,
      addUserMessage,
      addAssistantMessage,
      appendChunk,
      finalizeMessage,
      setStreaming,
    ],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const quickActions = chapter
    ? [
        {
          label: '⚡ 生成草稿',
          message: `请帮我为《${chapter.title}》生成草稿，本章目标：${chapter.plan.goal || '未设置'}，目标字数约 ${chapter.plan.wordTarget} 字`,
        },
        {
          label: '🔍 审稿',
          message: `请审阅《${chapter.title}》的草稿，指出需要改进的地方`,
        },
        {
          label: '✏️ 修订',
          message: `请根据之前的审稿意见，修订《${chapter.title}》的草稿`,
        },
      ]
    : [
        {
          label: '📖 创建第一章',
          message: '请帮我创建小说的第一章，并生成一段草稿内容',
        },
        {
          label: '🌍 设计世界观',
          message: '请帮我设计这部小说的世界观背景',
        },
        {
          label: '👥 创建人物',
          message: '请帮我创建主要人物的档案',
        },
      ]

  return (
    <div className="flex flex-col h-full">
      {/* Quick action chips */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-ctp-surface0 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              disabled={isStreaming || !isConfigured()}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs bg-ctp-surface1 text-ctp-subtext1 hover:bg-ctp-surface2 hover:text-ctp-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
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
                  <div className="max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed break-words bg-ctp-mauve/20 text-ctp-text">
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                </div>
              )
            }

            // Assistant message — parse into segments
            const segments = parseMessage(msg.content)
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%] space-y-1.5">
                  {segments.map((seg, i) =>
                    seg.type === 'text' ? (
                      seg.content.trim() ? (
                        <div
                          key={i}
                          className="bg-ctp-surface0 text-ctp-text px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap break-words"
                        >
                          {seg.content}
                        </div>
                      ) : null
                    ) : (
                      <ActionCard
                        key={i}
                        block={seg.block}
                        isStreaming={msg.isStreaming ?? false}
                        onExecute={handleExecuteAction}
                      />
                    ),
                  )}
                  {msg.isStreaming && segments.every((s) => s.type !== 'action') && (
                    <span className="inline-block w-0.5 h-4 bg-ctp-mauve animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
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
            <button
              onClick={handleStop}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-ctp-red/80 text-ctp-base hover:opacity-90 transition-opacity"
              title="停止"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !isConfigured() || !project}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-ctp-mauve text-ctp-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              title="发送"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
