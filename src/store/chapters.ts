import { create } from 'zustand'
import { db } from '@/db'
import type { Chapter, ChapterStatus, AuditIssue } from '@/types'

function genUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface ChaptersState {
  chapters: Chapter[]
  currentChapterId: string | null
  loadChapters: (projectId: string) => Promise<void>
  createChapter: (projectId: string, title: string) => Promise<Chapter>
  setCurrentChapter: (uid: string | null) => void
  updateChapterContent: (uid: string, field: 'draft' | 'revised' | 'final', content: string) => Promise<void>
  updateChapterStatus: (uid: string, status: ChapterStatus) => Promise<void>
  updateAuditReport: (uid: string, report: AuditIssue[]) => Promise<void>
  updateWordCount: (uid: string, count: number) => Promise<void>
  renameChapter: (uid: string, title: string) => Promise<void>
  deleteChapter: (uid: string) => Promise<void>
}

export const useChaptersStore = create<ChaptersState>((set, get) => ({
  chapters: [],
  currentChapterId: null,

  loadChapters: async (projectId) => {
    const chapters = await db.chapters.where('projectId').equals(projectId).sortBy('order')
    set({ chapters })
  },

  createChapter: async (projectId, title) => {
    const existing = await db.chapters.where('projectId').equals(projectId).count()
    const now = new Date()
    const chapter: Chapter = {
      uid: genUid(),
      projectId,
      title,
      order: existing,
      plan: { goal: '', wordTarget: 3000, subplotsToAdvance: [] },
      draft: '',
      auditReport: [],
      revised: '',
      final: '',
      status: 'planning',
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    await db.chapters.add(chapter)
    await get().loadChapters(projectId)
    return chapter
  },

  setCurrentChapter: (uid) => set({ currentChapterId: uid }),

  updateChapterContent: async (uid, field, content) => {
    await db.chapters.where('uid').equals(uid).modify({ [field]: content, updatedAt: new Date() })
    const chapters = get().chapters.map((c) =>
      c.uid === uid ? { ...c, [field]: content, updatedAt: new Date() } : c
    )
    set({ chapters })
  },

  updateChapterStatus: async (uid, status) => {
    await db.chapters.where('uid').equals(uid).modify({ status, updatedAt: new Date() })
    const chapters = get().chapters.map((c) =>
      c.uid === uid ? { ...c, status, updatedAt: new Date() } : c
    )
    set({ chapters })
  },

  updateAuditReport: async (uid, auditReport) => {
    await db.chapters.where('uid').equals(uid).modify({ auditReport, updatedAt: new Date() })
    const chapters = get().chapters.map((c) =>
      c.uid === uid ? { ...c, auditReport, updatedAt: new Date() } : c
    )
    set({ chapters })
  },

  updateWordCount: async (uid, wordCount) => {
    await db.chapters.where('uid').equals(uid).modify({ wordCount })
    const chapters = get().chapters.map((c) => (c.uid === uid ? { ...c, wordCount } : c))
    set({ chapters })
  },

  renameChapter: async (uid, title) => {
    await db.chapters.where('uid').equals(uid).modify({ title, updatedAt: new Date() })
    const chapters = get().chapters.map((c) => (c.uid === uid ? { ...c, title } : c))
    set({ chapters })
  },

  deleteChapter: async (uid) => {
    await db.chapters.where('uid').equals(uid).delete()
    const chapters = get().chapters.filter((c) => c.uid !== uid)
    set({ chapters, currentChapterId: get().currentChapterId === uid ? null : get().currentChapterId })
  },
}))
