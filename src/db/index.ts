import Dexie, { type Table } from 'dexie'
import type { Project, Chapter, TruthFile } from '@/types'

class WebNovelDB extends Dexie {
  projects!: Table<Project, number>
  chapters!: Table<Chapter, number>
  truthFiles!: Table<TruthFile, number>

  constructor() {
    super('webnovel-writer')
    this.version(1).stores({
      projects:   '++id, uid, name, genre, createdAt, updatedAt',
      chapters:   '++id, uid, projectId, order, status, updatedAt',
      truthFiles: '++id, uid, projectId, type, updatedAt',
    })
  }
}

export const db = new WebNovelDB()
