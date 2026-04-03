// lib/getRandomArtist.ts
import { LARGE_JAPANESE_ARTISTS } from './JapaneseArtists'
import { GLOBAL_ARTISTS } from './GlobalArtists'
import { filterByGenre } from './genres'
import type { Artist, GenreCategory, Difficulty } from '@/types'

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

const MIN_FOLLOWERS_HARD = 100_000
const MIN_FOLLOWERS_EASY = 400_000

// Exclude VTubers, proseka units, game characters, soundtrack composers
const EXCLUDED_IDS = new Set([
  '726WiFmWkohzodUxK3XjHX', // Hoshimachi Suisei
  '1VMXuPyhNldYomz8ojLKP7', // 25時、ナイトコードで。
  '6mEgpqXA4yzhhncW4cBHlh', // Vivid BAD SQUAD
  '1PhE6rv0146ZTQosoPDjk8', // Mori Calliope
  '5XaBNKQo65yYcjNA8wQPOk', // 宝鐘マリン
  '2GR0oaCTOgws9PfuheMw0k', // 白上フブキ
  '68609MOnEU86kVyMf26JnM', // 角巻わため
  '2YLI1Exc3ujaC7w7oWAqqy', // 沙花叉クロヱ
  '3sTxby2WaF9fXznsLp42IS', // 鷹嶺ルイ
  '6wzg6ZJ9dBUoOuk0hs2Ert', // 博衣こより
  '43FPwU0RdUqvTa3VaOAHnF', // 風真いろは
  '7C0PO4A4azl0xFMrE1EVDp', // 桐生一馬(黒田崇矢)
  '0YC192cP3KPCRWx8zr8MfZ', // Hans Zimmer
])

function buildPool(artists: Artist[], minFollowers: number): Artist[] {
  return artists.filter(a => (a.followers ?? 0) >= minFollowers && !EXCLUDED_IDS.has(a.id))
}

const allJapanese = (LARGE_JAPANESE_ARTISTS as unknown as Artist[])
  .filter(a => isJapaneseArtist(a as { nameJa?: string; genres?: readonly string[] }) && !EXCLUDED_IDS.has(a.id))

const allGlobal = (GLOBAL_ARTISTS as unknown as Artist[])
  .filter(a => !EXCLUDED_IDS.has(a.id))

export async function getRandomArtist(
  count = 5,
  genre: GenreCategory = 'all',
  region: 'jp' | 'global' = 'jp',
  difficulty: Difficulty = 'hard'
): Promise<Artist[]> {
  const minFollowers = difficulty === 'easy' ? MIN_FOLLOWERS_EASY : MIN_FOLLOWERS_HARD
  const base = region === 'global' ? allGlobal : allJapanese
  const pool = buildPool(base, minFollowers)
  const filtered = filterByGenre(pool, genre)

  // Pure random shuffle
  const shuffled = [...filtered].sort(() => Math.random() - 0.5)

  return shuffled.slice(0, Math.min(count, shuffled.length))
}
