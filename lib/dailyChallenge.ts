// lib/dailyChallenge.ts
import { LARGE_JAPANESE_ARTISTS } from './JapaneseArtists'
import type { Artist } from '@/types'

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function getTodayDateString(): string {
  const now = new Date()
  // Use JST (UTC+9)
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

export function getDailyQuestions(date?: string): Artist[] {
  const dateStr = date ?? getTodayDateString()
  const seed = hashCode(`spotthepop-daily-${dateStr}`)
  const shuffled = seededShuffle(LARGE_JAPANESE_ARTISTS as unknown as Artist[], seed)
  // Pick 5 questions with reasonable popularity (30-80) for good gameplay
  const filtered = shuffled.filter(a => a.popularity >= 30 && a.popularity <= 80)
  return filtered.slice(0, 5)
}

export function getDailyChallengeId(date?: string): string {
  return `daily-${date ?? getTodayDateString()}`
}
