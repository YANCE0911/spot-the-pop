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
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import type { Ranking } from '@/types'

const RANKING_COLLECTION = 'ranking'

// --- Season helpers ---
// Quarterly seasons: Season 1 = Apr-Jun 2026, Season 2 = Jul-Sep 2026, ...
// Everything before April 2026 is "Season 0" (pre-season / old scoring)
const SEASON_ORIGIN_YEAR = 2026
const SEASON_ORIGIN_QUARTER = 1 // Q2 (Apr-Jun) = Season 1

// Quarter boundaries: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
const QUARTER_START_MONTHS = [0, 3, 6, 9] // 0-indexed months (Jan, Apr, Jul, Oct)
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getCurrentSeasonNumber(): number {
  const now = new Date()
  // JST = UTC+9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = jst.getUTCFullYear()
  const month = jst.getUTCMonth() // 0-indexed
  const quarter = Math.floor(month / 3) // 0=Q1, 1=Q2, 2=Q3, 3=Q4
  // Season 1 starts at Q2 2026 (quarter index 1)
  return (year - SEASON_ORIGIN_YEAR) * 4 + (quarter - SEASON_ORIGIN_QUARTER) + 1
}

export function getSeasonLabel(seasonNum: number): string {
  const quarterOffset = seasonNum - 1 + SEASON_ORIGIN_QUARTER
  const year = SEASON_ORIGIN_YEAR + Math.floor(quarterOffset / 4)
  const quarter = quarterOffset % 4 // 0-3
  const startMonth = QUARTER_START_MONTHS[quarter]
  const endMonth = startMonth + 2
  return `${MONTH_ABBR[startMonth]}-${MONTH_ABBR[endMonth]} ${year}`
}

export function getSeasonRange(seasonNum: number): { start: Timestamp; end: Timestamp } {
  const quarterOffset = seasonNum - 1 + SEASON_ORIGIN_QUARTER
  const year = SEASON_ORIGIN_YEAR + Math.floor(quarterOffset / 4)
  const quarter = quarterOffset % 4
  const startMonth = QUARTER_START_MONTHS[quarter] // 0-indexed

  // JST midnight → UTC (subtract 9 hours)
  const start = new Date(Date.UTC(year, startMonth, 1, -9))
  const end = new Date(Date.UTC(year, startMonth + 3, 1, -9))
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  }
}

// List all past seasons (Season 1 to current-1)
export function getPastSeasons(): { num: number; label: string }[] {
  const current = getCurrentSeasonNumber()
  const seasons: { num: number; label: string }[] = []
  for (let i = current - 1; i >= 1; i--) {
    seasons.push({ num: i, label: getSeasonLabel(i) })
  }
  return seasons
}

// --- Rankings ---

async function getRankingsForRange(
  start: Timestamp,
  end: Timestamp,
  count: number,
  gameType?: 'versus' | 'timeline',
  region?: 'jp' | 'global'
): Promise<Ranking[]> {
  try {
    const q = query(
      collection(db, RANKING_COLLECTION),
      where('createdAt', '>=', start),
      where('createdAt', '<', end),
      orderBy('createdAt'),
      limit(500)
    )
    const snapshot = await getDocs(q)
    let all = snapshot.docs.map(doc => doc.data() as Ranking)
    if (gameType === 'timeline') {
      all = all.filter(r => r.gameType === 'timeline')
    } else if (gameType === 'versus') {
      all = all.filter(r => !r.gameType || r.gameType === 'versus')
    }
    // Filter by region (existing entries without region are treated as 'jp')
    if (region) {
      all = all.filter(r => (r.region ?? 'jp') === region)
    }
    return all.sort((a, b) => b.score - a.score).slice(0, count)
  } catch {
    return []
  }
}

// Current season rankings
export async function getTopRankings(count = 50, gameType?: 'versus' | 'timeline', region?: 'jp' | 'global'): Promise<Ranking[]> {
  const { start, end } = getSeasonRange(getCurrentSeasonNumber())
  return getRankingsForRange(start, end, count, gameType, region)
}

// Specific season rankings
export async function getSeasonRankings(seasonNum: number, count = 50, gameType?: 'versus' | 'timeline', region?: 'jp' | 'global'): Promise<Ranking[]> {
  const { start, end } = getSeasonRange(seasonNum)
  return getRankingsForRange(start, end, count, gameType, region)
}

// Get player's rank (1-indexed) for current season
export async function getPlayerRank(playerId: string, gameType: 'versus' | 'timeline', region?: 'jp' | 'global'): Promise<{ rank: number; score: number } | null> {
  if (!playerId) return null
  try {
    const { start, end } = getSeasonRange(getCurrentSeasonNumber())
    const q = query(
      collection(db, RANKING_COLLECTION),
      where('createdAt', '>=', start),
      where('createdAt', '<', end),
      orderBy('createdAt'),
      limit(500)
    )
    const snapshot = await getDocs(q)
    let all = snapshot.docs.map(doc => doc.data() as Ranking)
    if (gameType === 'timeline') {
      all = all.filter(r => r.gameType === 'timeline')
    } else {
      all = all.filter(r => !r.gameType || r.gameType === 'versus')
    }
    if (region) {
      all = all.filter(r => (r.region ?? 'jp') === region)
    }
    const sorted = all.sort((a, b) => b.score - a.score)
    const idx = sorted.findIndex(r => r.playerId === playerId)
    if (idx === -1) return null
    return { rank: idx + 1, score: sorted[idx].score }
  } catch {
    return null
  }
}

// --- Fraud prevention ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 5
const submitTimestamps = new Map<string, number[]>()

// Save ranking with best-score-only logic per playerId + gameType + season
export async function saveRanking(
  name: string,
  score: number,
  mode?: string,
  metric?: string,
  genre?: string,
  gameType?: 'versus' | 'timeline',
  playerId?: string,
  region?: 'jp' | 'global'
) {
  const rejected = { updated: false, bestScore: 0 }

  // Score range validation
  if (score < 0 || score > 100) return rejected

  // Rate limiting per playerId
  if (playerId) {
    const now = Date.now()
    const timestamps = submitTimestamps.get(playerId) ?? []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
    if (recent.length >= RATE_LIMIT_MAX) return rejected
    recent.push(now)
    submitTimestamps.set(playerId, recent)
  }

  const gt = gameType ?? 'versus'
  const { start } = getSeasonRange(getCurrentSeasonNumber())

  // If playerId provided, check for existing entry in current season
  // Use simple query (playerId + gameType only) to avoid composite index requirement,
  // then filter by season in JS
  if (playerId) {
    try {
      const q = query(
        collection(db, RANKING_COLLECTION),
        where('playerId', '==', playerId),
        where('gameType', '==', gt),
      )
      const snapshot = await getDocs(q)
      // Filter to current season in JS
      const startMs = start.toMillis()
      const seasonDocs = snapshot.docs.filter(d => {
        const created = d.data().createdAt
        return created && created.toMillis() >= startMs
      })
      if (seasonDocs.length > 0) {
        const existingDoc = seasonDocs[0]
        const existing = existingDoc.data() as Ranking
        if (score <= existing.score) {
          return { updated: false, bestScore: existing.score }
        }
        await updateDoc(existingDoc.ref, {
          name,
          score,
          createdAt: Timestamp.now(),
        })
        return { updated: true, bestScore: score }
      }
    } catch (e) {
      console.error('saveRanking: existing check failed, creating new entry', e)
    }
  }

  await addDoc(collection(db, RANKING_COLLECTION), {
    name,
    score,
    mode: mode ?? 'classic',
    metric: metric ?? 'popularity',
    genre: genre ?? null,
    gameType: gt,
    playerId: playerId ?? null,
    region: region ?? 'jp',
    createdAt: Timestamp.now(),
  })
  return { updated: false, bestScore: score }
}

// --- Legacy / Daily ---

const DAILY_RANKING_COLLECTION = 'daily_rankings'

// Season 0 (pre-season, old scoring: lower is better, before April 2026)
const SEASON0_END = Timestamp.fromDate(new Date('2026-03-31T15:00:00Z')) // April 1 JST

export async function getSeason0Rankings(count = 10): Promise<Ranking[]> {
  try {
    const q = query(
      collection(db, RANKING_COLLECTION),
      where('createdAt', '<', SEASON0_END),
      orderBy('createdAt'),
      limit(200)
    )
    const snapshot = await getDocs(q)
    const all = snapshot.docs.map(doc => doc.data() as Ranking)
    return all.sort((a, b) => a.score - b.score).slice(0, count)
  } catch {
    return []
  }
}

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
