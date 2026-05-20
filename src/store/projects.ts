import { create } from 'zustand'
import { db } from '@/db'
import type { Project, Genre } from '@/types'

function genUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface ProjectsState {
  projects: Project[]
  currentProjectId: string | null
  loading: boolean
  loadProjects: () => Promise<void>
  createProject: (name: string, genre: Genre) => Promise<Project>
  setCurrentProject: (uid: string | null) => void
  updateProject: (uid: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (uid: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true })
    const projects = await db.projects.orderBy('createdAt').reverse().toArray()
    set({ projects, loading: false })
  },

  createProject: async (name, genre) => {
    const now = new Date()
    const project: Project = {
      uid: genUid(),
      name,
      genre,
      createdAt: now,
      updatedAt: now,
    }
    await db.projects.add(project)
    await get().loadProjects()
    return project
  },

  setCurrentProject: (uid) => set({ currentProjectId: uid }),

  updateProject: async (uid, patch) => {
    await db.projects.where('uid').equals(uid).modify({ ...patch, updatedAt: new Date() })
    await get().loadProjects()
  },

  deleteProject: async (uid) => {
    await db.projects.where('uid').equals(uid).delete()
    await db.chapters.where('projectId').equals(uid).delete()
    await db.truthFiles.where('projectId').equals(uid).delete()
    await get().loadProjects()
  },
}))
