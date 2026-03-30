// lib/ranking.ts
import { db } from './firebase'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import type { Ranking } from '@/types'

const RANKING_COLLECTION = 'ranking'
const DAILY_RANKING_COLLECTION = 'daily_rankings'

// Season boundary: Season 1 starts 2026-03-29T00:00:00 JST (2026-03-28T15:00:00 UTC)
const SEASON1_START = Timestamp.fromDate(new Date('2026-03-28T15:00:00Z'))

// Current season (Season 1) rankings
export async function getTopRankings(count = 10, gameType?: 'versus' | 'timeline'): Promise<Ranking[]> {
  try {
    const q = query(
      collection(db, RANKING_COLLECTION),
      where('createdAt', '>=', SEASON1_START),
      orderBy('createdAt'),
      limit(200)
    )
    const snapshot = await getDocs(q)
    let all = snapshot.docs.map(doc => doc.data() as Ranking)
    if (gameType === 'timeline') {
      all = all.filter(r => r.gameType === 'timeline')
    } else if (gameType === 'versus') {
      all = all.filter(r => !r.gameType || r.gameType === 'versus')
    }
    return all.sort((a, b) => b.score - a.score).slice(0, count)
  } catch {
    const q = query(collection(db, RANKING_COLLECTION), orderBy('score', 'desc'), limit(count))
    const snapshot = await getDocs(q)
    let all = snapshot.docs.map(doc => doc.data() as Ranking)
    if (gameType === 'timeline') {
      all = all.filter(r => r.gameType === 'timeline')
    } else if (gameType === 'versus') {
      all = all.filter(r => !r.gameType || r.gameType === 'versus')
    }
    return all.slice(0, count)
  }
}

export async function saveRanking(name: string, score: number, mode?: string, metric?: string, genre?: string, gameType?: 'versus' | 'timeline') {
  await addDoc(collection(db, RANKING_COLLECTION), {
    name,
    score,
    mode: mode ?? 'classic',
    metric: metric ?? 'popularity',
    genre: genre ?? null,
    gameType: gameType ?? 'versus',
    createdAt: Timestamp.now(),
  })
}

// Daily rankings
export async function getDailyRankings(date: string, count = 20): Promise<Ranking[]> {
  const q = query(
    collection(db, DAILY_RANKING_COLLECTION),
    where('date', '==', date),
    orderBy('score', 'desc'),
    limit(count)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as Ranking)
}

export async function saveDailyRanking(name: string, score: number, date: string) {
  await addDoc(collection(db, DAILY_RANKING_COLLECTION), {
    name,
    score,
    date,
    createdAt: Timestamp.now(),
  })
}

// Season 0 rankings (old scoring: lower is better, data before 2026-03-29)
export async function getSeason0Rankings(count = 10): Promise<Ranking[]> {
  try {
    const q = query(
      collection(db, RANKING_COLLECTION),
      where('createdAt', '<', SEASON1_START),
      orderBy('createdAt'),
      limit(200)
    )
    const snapshot = await getDocs(q)
    const all = snapshot.docs.map(doc => doc.data() as Ranking)
    return all.sort((a, b) => a.score - b.score).slice(0, count)
  } catch {
    // Fallback
    const q = query(collection(db, RANKING_COLLECTION), orderBy('score', 'asc'), limit(count))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as Ranking)
  }
}

// Season archives
export type SeasonArchive = {
  name: string
  rankings: { rank: number; name: string; score: number }[]
  archivedAt: { seconds: number }
}

export async function getSeasonArchive(seasonId: string): Promise<SeasonArchive | null> {
  const snap = await getDoc(doc(db, 'season_archives', seasonId))
  if (!snap.exists()) return null
  return snap.data() as SeasonArchive
}

export async function getAllSeasonArchives(): Promise<SeasonArchive[]> {
  const q = query(collection(db, 'season_archives'), orderBy('archivedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => d.data() as SeasonArchive)
}

// Monthly rankings (current month)
export async function getMonthlyRankings(yearMonth: string, count = 10): Promise<Ranking[]> {
  // yearMonth format: "2026-03"
  const startDate = new Date(`${yearMonth}-01T00:00:00Z`)
  const endMonth = new Date(startDate)
  endMonth.setMonth(endMonth.getMonth() + 1)

  const q = query(
    collection(db, RANKING_COLLECTION),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<', Timestamp.fromDate(endMonth)),
    orderBy('createdAt'),
    limit(100)
  )

  try {
    const snapshot = await getDocs(q)
    const all = snapshot.docs.map(d => d.data() as Ranking)
    return all.sort((a, b) => b.score - a.score).slice(0, count)
  } catch {
    // Fallback if composite index doesn't exist
    return getTopRankings(count)
  }
}
