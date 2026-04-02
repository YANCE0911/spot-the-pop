/**
 * Weekly question pack builder.
 * Reads from questionBank.json / globalQuestionBank.json,
 * samples 80 questions (main:50 + extra:30) per region using
 * a deterministic seed derived from the ISO week number.
 *
 * Output: public/packs/{region}/week-{YYYY}-{WW}.json
 *
 * Usage:
 *   npx ts-node scripts/buildWeeklyPacks.ts          # current week
 *   npx ts-node scripts/buildWeeklyPacks.ts 2026-15  # specific week
 */

import fs from 'fs'
import path from 'path'

// ---------- Types ----------
type BankQuestion = {
  trackName: string
  albumName: string
  artistName: string
  artistNameJa?: string
  artistId: string
  albumImageUrl?: string
  releaseYear: number
  spotifyUrl?: string
  artistPopularity: number
  trackPopularity: number
  source: 'single' | 'album' | 'topTrack'
}

type PackQuestion = {
  trackName: string
  singleName: string
  artistName: string
  artistNameJa?: string
  albumImageUrl?: string
  releaseYear: number
  spotifyUrl?: string
}

// ---------- Deterministic PRNG (mulberry32) ----------
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- ISO week ----------
function getISOWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: date.getUTCFullYear(), week }
}

// ---------- Filters (same as tracks.ts) ----------
const TRACK_EXCLUDE_PATTERN = /\((.*?)?(remaster|live|acoustic|remix|edit|mix|version|instrumental|karaoke|demo)\)/i
const TRACK_EXCLUDE_KEYWORDS = /first\s*take|the\s*first\s*take|\bBGM\b|\binstrumental\b/i
const ALBUM_EXCLUDE_PATTERN = /soundtrack|[\bO]ST\b|original\s*soundtrack|サウンドトラック/i

function isValidQuestion(trackName: string, albumName: string): boolean {
  if (TRACK_EXCLUDE_PATTERN.test(trackName)) return false
  if (TRACK_EXCLUDE_KEYWORDS.test(trackName)) return false
  if (ALBUM_EXCLUDE_PATTERN.test(albumName)) return false
  return true
}

function meetsPopularityThreshold(q: BankQuestion): boolean {
  const year = q.releaseYear
  if (year <= 2004) return q.artistPopularity >= 20
  if (year <= 2014) return q.artistPopularity >= 25
  if (year <= 2019) return q.artistPopularity >= 35
  return q.artistPopularity >= 40
}

function meetsTrackPopularity(q: BankQuestion): boolean {
  const year = q.releaseYear
  if (year <= 2004) return q.trackPopularity >= 15
  if (year <= 2014) return q.trackPopularity >= 20
  if (year <= 2019) return q.trackPopularity >= 25
  return q.trackPopularity >= 30
}

// ---------- Year buckets ----------
const YEAR_BUCKETS = [
  { min: 1960, max: 2004, quota: 2 },
  { min: 2005, max: 2014, quota: 3 },
  { min: 2015, max: 2019, quota: 2 },
  { min: 2020, max: 2030, quota: 3 },
]

function getBucketIndex(year: number): number {
  return YEAR_BUCKETS.findIndex(b => year >= b.min && year <= b.max)
}

// ---------- Sample questions ----------
function sampleQuestions(pool: BankQuestion[], count: number, rand: () => number): PackQuestion[] {
  const eligible = pool.filter(q =>
    meetsPopularityThreshold(q) && meetsTrackPopularity(q) && isValidQuestion(q.trackName, q.albumName)
  )

  const buckets: BankQuestion[][] = YEAR_BUCKETS.map(() => [])
  for (const q of eligible) {
    const bi = getBucketIndex(q.releaseYear)
    if (bi !== -1) buckets[bi].push(q)
  }
  for (let i = 0; i < buckets.length; i++) {
    buckets[i] = shuffle(buckets[i], rand)
  }

  const questions: PackQuestion[] = []
  const usedArtists = new Set<string>()

  // Fill buckets proportionally: for 80 questions, multiply quotas by 8
  const multiplier = Math.ceil(count / 10)
  for (let bi = 0; bi < YEAR_BUCKETS.length; bi++) {
    const quota = YEAR_BUCKETS[bi].quota * multiplier
    let filled = 0
    for (const q of buckets[bi]) {
      if (filled >= quota) break
      const artistKey = (q.artistNameJa || q.artistName).toLowerCase()
      if (usedArtists.has(artistKey)) continue
      usedArtists.add(artistKey)
      questions.push({
        trackName: q.trackName,
        singleName: q.albumName,
        artistName: q.artistName,
        artistNameJa: q.artistNameJa,
        albumImageUrl: q.albumImageUrl,
        releaseYear: q.releaseYear,
        spotifyUrl: q.spotifyUrl,
      })
      filled++
    }
  }

  // Fill remainder from all eligible
  if (questions.length < count) {
    const rest = shuffle(eligible, rand)
    for (const q of rest) {
      if (questions.length >= count) break
      const artistKey = (q.artistNameJa || q.artistName).toLowerCase()
      if (usedArtists.has(artistKey)) continue
      usedArtists.add(artistKey)
      questions.push({
        trackName: q.trackName,
        singleName: q.albumName,
        artistName: q.artistName,
        artistNameJa: q.artistNameJa,
        albumImageUrl: q.albumImageUrl,
        releaseYear: q.releaseYear,
        spotifyUrl: q.spotifyUrl,
      })
    }
  }

  return shuffle(questions.slice(0, count), rand)
}

// ---------- Main ----------
function main() {
  const root = path.resolve(__dirname, '..')
  const arg = process.argv[2] // optional: "2026-15"

  let isoYear: number, isoWeek: number
  if (arg && /^\d{4}-\d{1,2}$/.test(arg)) {
    const [y, w] = arg.split('-').map(Number)
    isoYear = y
    isoWeek = w
  } else {
    const now = new Date()
    const iso = getISOWeek(now)
    isoYear = iso.year
    isoWeek = iso.week
  }

  const weekKey = `${isoYear}-${String(isoWeek).padStart(2, '0')}`
  const seed = isoYear * 100 + isoWeek
  console.log(`Building packs for week ${weekKey} (seed: ${seed})`)

  const regions: { key: string; file: string }[] = [
    { key: 'jp', file: 'questionBank.json' },
    { key: 'global', file: 'globalQuestionBank.json' },
  ]

  for (const { key, file } of regions) {
    const bankPath = path.join(root, 'data', file)
    if (!fs.existsSync(bankPath)) {
      console.log(`  Skipping ${key}: ${file} not found`)
      continue
    }

    const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'))
    const pool: BankQuestion[] = raw.questions ?? []
    console.log(`  ${key}: ${pool.length} questions in bank`)

    // Use different sub-seeds for main and extra
    const mainRand = mulberry32(seed * 2 + (key === 'jp' ? 0 : 1))
    const extraRand = mulberry32(seed * 2 + (key === 'jp' ? 1000 : 1001))

    const main = sampleQuestions(pool, 700, mainRand)
    const extra = sampleQuestions(pool, 300, extraRand)

    const outDir = path.join(root, 'public', 'packs', key)
    fs.mkdirSync(outDir, { recursive: true })

    const outPath = path.join(outDir, `week-${weekKey}.json`)
    fs.writeFileSync(outPath, JSON.stringify({ week: weekKey, main, extra }, null, 0))
    console.log(`  → ${outPath} (main: ${main.length}, extra: ${extra.length})`)
  }

  console.log('Done.')
}

main()
