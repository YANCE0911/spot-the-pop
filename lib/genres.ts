// lib/genres.ts
import { GENRE_CATEGORIES, type GenreCategory, type Artist } from '@/types'

export function matchesGenre(artist: Artist, genreId: GenreCategory): boolean {
  if (genreId === 'all') return true
  const category = GENRE_CATEGORIES.find(g => g.id === genreId)
  if (!category) return true
  const artistGenres = (artist.genres ?? []).map(g => g.toLowerCase())
  return category.keywords.some(kw => artistGenres.some(ag => ag.includes(kw)))
}

export function filterByGenre(artists: Artist[], genreId: GenreCategory): Artist[] {
  if (genreId === 'all') return artists
  return artists.filter(a => matchesGenre(a, genreId))
}

export function getGenreLabel(genreId: GenreCategory, lang: 'en' | 'ja' = 'en'): string {
  const cat = GENRE_CATEGORIES.find(g => g.id === genreId)
  if (!cat) return genreId
  return lang === 'ja' ? cat.labelJa : cat.label
}

export function detectPrimaryGenre(genres: string[]): GenreCategory {
  const lower = genres.map(g => g.toLowerCase())
  for (const cat of GENRE_CATEGORIES) {
    if (cat.id === 'all') continue
    if (cat.keywords.some(kw => lower.some(g => g.includes(kw)))) {
      return cat.id
    }
  }
  return 'all'
}
