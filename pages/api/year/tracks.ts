import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getSpotifyToken } from '@/lib/spotify'
import { LARGE_JAPANESE_ARTISTS } from '@/lib/JapaneseArtists'

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

type TrackQuestion = {
  trackName: string
  singleName: string
  artistName: string
  artistNameJa?: string
  albumImageUrl?: string
  releaseYear: number
  spotifyUrl?: string
}

// Year-bucket distribution
const YEAR_BUCKETS: { min: number; max: number; quota: number }[] = [
  { min: 1960, max: 2004, quota: 2 },
  { min: 2005, max: 2014, quota: 3 },
  { min: 2015, max: 2019, quota: 2 },
  { min: 2020, max: 2030, quota: 3 },
]

// Year-based artist popularity thresholds
function meetsPopularityThreshold(q: BankQuestion): boolean {
  const year = q.releaseYear
  if (year <= 2004) return q.artistPopularity >= 20
  if (year <= 2014) return q.artistPopularity >= 25
  if (year <= 2019) return q.artistPopularity >= 35
  return q.artistPopularity >= 40
}

function getBucketIndex(year: number): number {
  return YEAR_BUCKETS.findIndex(b => year >= b.min && year <= b.max)
}

// Load question banks (cached in memory)
let questionBank: BankQuestion[] | null = null

function loadQuestionBank(): BankQuestion[] | null {
  if (questionBank) return questionBank

  const banks: BankQuestion[] = []

  // Load Japanese question bank
  const bankPath = path.join(process.cwd(), 'data', 'questionBank.json')
  if (fs.existsSync(bankPath)) {
    const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'))
    banks.push(...(raw.questions as BankQuestion[]))
  }

  // Load global question bank
  const globalPath = path.join(process.cwd(), 'data', 'globalQuestionBank.json')
  if (fs.existsSync(globalPath)) {
    const raw = JSON.parse(fs.readFileSync(globalPath, 'utf-8'))
    banks.push(...(raw.questions as BankQuestion[]))
  }

  if (banks.length === 0) return null

  questionBank = banks
  console.log(`Loaded question bank: ${questionBank.length} questions (JP + Global)`)
  return questionBank
}

function questionsFromBank(count: number): TrackQuestion[] {
  const bank = loadQuestionBank()
  if (!bank || bank.length === 0) return []

  const eligible = bank.filter(meetsPopularityThreshold)
  const buckets: BankQuestion[][] = YEAR_BUCKETS.map(() => [])
  for (const q of eligible) {
    const bi = getBucketIndex(q.releaseYear)
    if (bi !== -1) buckets[bi].push(q)
  }
  for (const bucket of buckets) bucket.sort(() => Math.random() - 0.5)

  const questions: TrackQuestion[] = []
  const usedArtistNames = new Set<string>()

  for (let bi = 0; bi < YEAR_BUCKETS.length; bi++) {
    const quota = YEAR_BUCKETS[bi].quota
    let filled = 0
    for (const q of buckets[bi]) {
      if (filled >= quota) break
      const artistKey = (q.artistNameJa || q.artistName).toLowerCase()
      if (usedArtistNames.has(artistKey)) continue
      usedArtistNames.add(artistKey)
      questions.push({
        trackName: q.trackName, singleName: q.albumName,
        artistName: q.artistName, artistNameJa: q.artistNameJa,
        albumImageUrl: q.albumImageUrl, releaseYear: q.releaseYear, spotifyUrl: q.spotifyUrl,
      })
      filled++
    }
  }

  if (questions.length < count) {
    const allShuffled = [...eligible].sort(() => Math.random() - 0.5)
    for (const q of allShuffled) {
      if (questions.length >= count) break
      const artistKey = (q.artistNameJa || q.artistName).toLowerCase()
      if (usedArtistNames.has(artistKey)) continue
      usedArtistNames.add(artistKey)
      questions.push({
        trackName: q.trackName, singleName: q.albumName,
        artistName: q.artistName, artistNameJa: q.artistNameJa,
        albumImageUrl: q.albumImageUrl, releaseYear: q.releaseYear, spotifyUrl: q.spotifyUrl,
      })
    }
  }

  return [...questions].sort(() => Math.random() - 0.5)
}

// Fallback: fetch top tracks from Spotify API directly (parallel)
async function questionsFromSpotifyAPI(count: number): Promise<TrackQuestion[]> {
  const token = await getSpotifyToken()
  // Pick candidates and fetch in small parallel batches to avoid rate limiting
  const candidates = [...LARGE_JAPANESE_ARTISTS].sort(() => Math.random() - 0.5).slice(0, count * 4)

  // Fetch in batches of 5 to avoid rate limiting
  const results: PromiseSettledResult<TrackQuestion | null>[] = []
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5)
    const batchResults = await Promise.allSettled(
      batch.map(async (artist) => {
      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=JP`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return null
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = (data.tracks ?? []) as any[]
      if (tracks.length === 0) return null

      const track = tracks[Math.floor(Math.random() * Math.min(tracks.length, 5))]
      const album = track.album
      if (!album) return null

      const year = parseInt((album.release_date ?? '').split('-')[0])
      if (!year || year < 1960) return null

      return {
        trackName: track.name,
        singleName: album.name,
        artistName: artist.name,
        artistNameJa: (artist as { nameJa?: string }).nameJa,
        albumImageUrl: album.images?.[0]?.url,
        releaseYear: year,
        spotifyUrl: track.external_urls?.spotify,
      } as TrackQuestion
    })
    )
    results.push(...batchResults)
    // Stop early if we have enough
    const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value).length
    if (fulfilled >= count) break
  }

  const questions: TrackQuestion[] = []
  const usedArtists = new Set<string>()
  for (const r of results) {
    if (questions.length >= count) break
    if (r.status !== 'fulfilled' || !r.value) continue
    const q = r.value
    if (usedArtists.has(q.artistName)) continue
    usedArtists.add(q.artistName)
    questions.push(q)
  }

  return questions.sort(() => Math.random() - 0.5)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const count = Math.min(parseInt(req.query.count as string) || 10, 15)

  try {
    // Try question bank first, fallback to Spotify API
    let questions = questionsFromBank(count)
    if (questions.length < count) {
      console.log('Question bank unavailable or insufficient, falling back to Spotify API')
      questions = await questionsFromSpotifyAPI(count)
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ questions })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
