// lib/getRandomArtist.ts
import { LARGE_JAPANESE_ARTISTS } from './JapaneseArtists'
import { filterByGenre } from './genres'
import type { Artist, GenreCategory } from '@/types'

// Japanese artist detection keywords
const JP_GENRE_KEYWORDS = [
  'j-pop', 'j-rock', 'j-rap', 'j-r&b', 'j-dance', 'j-idol',
  'japanese', 'anime', 'kayokyoku', 'kayōkyoku', 'enka',
  'visual kei', 'shibuya-kei',
]

function isJapaneseArtist(a: { nameJa?: string; genres?: readonly string[] }): boolean {
  if (a.nameJa) return true
  return (a.genres ?? []).some(g =>
    JP_GENRE_KEYWORDS.some(k => g.includes(k))
  )
}

const MIN_FOLLOWERS = 100_000
// TODO: 難易度モード実装時に分ける
// Normal: 100_000+ / Hard: 30_000+ (全体)

// Soft-delete: international artists are kept in the list but excluded from questions
// TODO: re-enable when international mode is implemented
const japaneseArtists = (LARGE_JAPANESE_ARTISTS as unknown as Artist[])
  .filter(a => isJapaneseArtist(a as any) && (a.followers ?? 0) >= MIN_FOLLOWERS)

export async function getRandomArtist(
  count = 5,
  genre: GenreCategory = 'all'
): Promise<Artist[]> {
  const filtered = filterByGenre(japaneseArtists, genre)

  // Pure random shuffle
  const shuffled = [...filtered].sort(() => Math.random() - 0.5)

  return shuffled.slice(0, Math.min(count, shuffled.length))
}
