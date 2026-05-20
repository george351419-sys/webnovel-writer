import { create } from 'zustand'
import { db } from '@/db'
import type { TruthFile, TruthFileType } from '@/types'

function genUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface TruthFilesState {
  truthFiles: TruthFile[]
  currentType: TruthFileType | null
  loadTruthFiles: (projectId: string) => Promise<void>
  ensureTruthFiles: (projectId: string) => Promise<void>
  updateTruthFile: (projectId: string, type: TruthFileType, content: string) => Promise<void>
  setCurrentType: (type: TruthFileType | null) => void
}

const ALL_TYPES: TruthFileType[] = ['worldview', 'characters', 'resources', 'hooks', 'summaries', 'subplots', 'emotional']

export const useTruthFilesStore = create<TruthFilesState>((set, get) => ({
  truthFiles: [],
  currentType: null,

  loadTruthFiles: async (projectId) => {
    const truthFiles = await db.truthFiles.where('projectId').equals(projectId).toArray()
    set({ truthFiles })
  },

  ensureTruthFiles: async (projectId) => {
    const existing = await db.truthFiles.where('projectId').equals(projectId).toArray()
    const existingTypes = new Set(existing.map((f) => f.type))
    const missing = ALL_TYPES.filter((t) => !existingTypes.has(t))
    if (missing.length > 0) {
      const now = new Date()
      await db.truthFiles.bulkAdd(
        missing.map((type) => ({
          uid: genUid(),
          projectId,
          type,
          content: '',
          updatedAt: now,
        }))
      )
    }
    await get().loadTruthFiles(projectId)
  },

  updateTruthFile: async (projectId, type, content) => {
    const existing = get().truthFiles.find((f) => f.projectId === projectId && f.type === type)
    if (existing) {
      await db.truthFiles.where('uid').equals(existing.uid).modify({ content, updatedAt: new Date() })
    } else {
      await db.truthFiles.add({ uid: genUid(), projectId, type, content, updatedAt: new Date() })
    }
    await get().loadTruthFiles(projectId)
  },

  setCurrentType: (type) => set({ currentType: type }),
}))
