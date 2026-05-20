import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SingleModelConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
}

interface ModelConfigState {
  writing: SingleModelConfig
  audit: SingleModelConfig
  revise: SingleModelConfig
  updateWriting: (cfg: Partial<SingleModelConfig>) => void
  updateAudit: (cfg: Partial<SingleModelConfig>) => void
  updateRevise: (cfg: Partial<SingleModelConfig>) => void
  isConfigured: () => boolean
}

const DEFAULT_CONFIG: SingleModelConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
}

export const useModelConfigStore = create<ModelConfigState>()(
  persist(
    (set, get) => ({
      writing: { ...DEFAULT_CONFIG },
      audit:   { ...DEFAULT_CONFIG, temperature: 0.3 },
      revise:  { ...DEFAULT_CONFIG, temperature: 0.5 },

      updateWriting: (cfg) => set((s) => ({ writing: { ...s.writing, ...cfg } })),
      updateAudit:   (cfg) => set((s) => ({ audit:   { ...s.audit,   ...cfg } })),
      updateRevise:  (cfg) => set((s) => ({ revise:  { ...s.revise,  ...cfg } })),

      isConfigured: () => {
        const { writing } = get()
        return writing.apiKey.trim().length > 0
      },
    }),
    {
      name: 'webnovel-model-config',
    }
  )
)
