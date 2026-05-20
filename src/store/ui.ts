import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  rightPanelCollapsed: boolean
  activeView: 'editor' | 'truth-file' | 'style-fingerprint'
  streamingText: string | null
  toggleSidebar: () => void
  toggleRightPanel: () => void
  setActiveView: (view: 'editor' | 'truth-file' | 'style-fingerprint') => void
  setStreamingText: (text: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  rightPanelCollapsed: false,
  activeView: 'editor',
  streamingText: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setActiveView: (view) => set({ activeView: view }),
  setStreamingText: (text) => set({ streamingText: text }),
}))
