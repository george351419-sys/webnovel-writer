import { useEffect, useRef, useState, useCallback } from 'react'
import { Bot, SendHorizontal, Square } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useChaptersStore } from '@/store/chapters'
import { useProjectsStore } from '@/store/projects'
import { useTruthFilesStore } from '@/store/truthFiles'
import { useModelConfigStore } from '@/store/modelConfig'
import { sendChatMessage } from '@/engine/chat/chatEngine'

export default function ChatPanel() {
  const { messages, isStreaming, addUserMessage, addAssistantMessage, appendChunk, finalizeMessage, setStreaming } =
    useChatStore()
  const { chapters, currentChapterId } = useChaptersStore()
  const { projects, currentProjectId } = useProjectsStore()
  const { truthFiles } = useTruthFilesStore()
  const isConfigured = useModelConfigStore((s) => s.isConfigured)

  const chapter = chapters.find((c) => c.uid === currentChapterId) ?? null
  const project = projects.find((p) => p.uid === currentProjectId) ?? null

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    const lineHeight = 20
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 6
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !project) return

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
    ]
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

  // Quick-action chips
  const quickActions = chapter
    ? [
        {
          label: '✦ 生成草稿',
          message: `请帮我生成《${chapter.title}》的草稿，本章目标：${chapter.plan.goal}，目标字数：${chapter.plan.wordTarget}字`,
        },
        {
          label: '🔍 审稿',
          message: '请对当前章节草稿进行审稿，从故事性、人物塑造、节奏感等维度指出问题和改进建议',
        },
        {
          label: '✏️ 修订建议',
          message: '请根据审稿结果，给出具体的修订建议',
        },
        {
          label: '✓ 确认',
          message: `《${chapter.title}》的内容已经确认，请帮我总结本章的关键信息点`,
        },
      ]
    : []

  return (
    <div className="flex flex-col h-full">
      {/* Quick action chips */}
      {quickActions.length > 0 && (
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
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Bot className="w-8 h-8 text-ctp-surface2" />
            <p className="text-xs text-ctp-subtext0 leading-relaxed">
              你好！我是你的网文写作助手，
              <br />
              有什么可以帮你的？
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-ctp-mauve/20 text-ctp-text max-w-[85%]'
                    : 'bg-ctp-surface0 text-ctp-text'
                }`}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-ctp-mauve animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>
          ))
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
            placeholder="问我任何写作问题..."
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
