import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  addUserMessage: (content: string) => string
  addAssistantMessage: () => string
  appendChunk: (id: string, chunk: string) => void
  finalizeMessage: (id: string) => void
  setStreaming: (v: boolean) => void
  clear: () => void
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  addUserMessage: (content) => {
    const id = genId()
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', content }],
    }))
    return id
  },

  addAssistantMessage: () => {
    const id = genId()
    set((s) => ({
      messages: [...s.messages, { id, role: 'assistant', content: '', isStreaming: true }],
    }))
    return id
  },

  appendChunk: (id, chunk) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: chunk } : m
      ),
    }))
  },

  finalizeMessage: (id) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m
      ),
    }))
  },

  setStreaming: (v) => set({ isStreaming: v }),

  clear: () => set({ messages: [], isStreaming: false }),
}))
