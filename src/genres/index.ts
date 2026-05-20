import { xuanhuanGenre } from './xuanhuan'
import { systemGenre } from './system'
import { urbanGenre } from './urban'
import { scifiGenre } from './scifi'
import { historyGenre } from './history'
import { romanceGenre } from './romance'
import type { GenrePrompt } from './types'

export type { GenrePrompt }

export const GENRE_MAP: Record<string, GenrePrompt> = {
  xuanhuan: xuanhuanGenre,
  system: systemGenre,
  urban: urbanGenre,
  scifi: scifiGenre,
  history: historyGenre,
  romance: romanceGenre,
}
