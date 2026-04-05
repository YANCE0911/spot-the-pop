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

// Filter out tracks that would make bad quiz questions
const TRACK_EXCLUDE_PATTERN = /\((.*?)?(remaster|live|acoustic|remix|edit|mix|version|instrumental|karaoke|demo)\)/i
const TRACK_EXCLUDE_KEYWORDS = /first\s*take|the\s*first\s*take|\bBGM\b|\binstrumental\b/i
const ALBUM_EXCLUDE_PATTERN = /soundtrack|[\bO]ST\b|original\s*soundtrack|サウンドトラック/i

function isValidQuestion(trackName: string, albumName: string, albumType?: string): boolean {
  if (TRACK_EXCLUDE_PATTERN.test(trackName)) return false
  if (TRACK_EXCLUDE_KEYWORDS.test(trackName)) return false
  if (ALBUM_EXCLUDE_PATTERN.test(albumName)) return false
  if (albumType === 'compilation') return false
  return true
}

// Year-based artist popularity thresholds (Hard = current, Easy = +20)
function meetsPopularityThreshold(q: BankQuestion, difficulty: 'easy' | 'hard' = 'hard'): boolean {
  const year = q.releaseYear
  if (difficulty === 'easy') {
    if (year <= 2004) return q.artistPopularity >= 55
    if (year <= 2014) return q.artistPopularity >= 60
    if (year <= 2019) return q.artistPopularity >= 60
    return q.artistPopularity >= 65
  }
  if (year <= 2004) return q.artistPopularity >= 20
  if (year <= 2014) return q.artistPopularity >= 25
  if (year <= 2019) return q.artistPopularity >= 35
  return q.artistPopularity >= 40
}

// Year-based track popularity thresholds (Hard = current, Easy = +10)
function meetsTrackPopularity(q: BankQuestion, difficulty: 'easy' | 'hard' = 'hard'): boolean {
  const year = q.releaseYear
  if (difficulty === 'easy') {
    if (year <= 2004) return q.trackPopularity >= 45
    if (year <= 2014) return q.trackPopularity >= 40
    if (year <= 2019) return q.trackPopularity >= 38
    return q.trackPopularity >= 35
  }
  if (year <= 2004) return q.trackPopularity >= 15
  if (year <= 2014) return q.trackPopularity >= 20
  if (year <= 2019) return q.trackPopularity >= 25
  return q.trackPopularity >= 30
}

function getBucketIndex(year: number): number {
  return YEAR_BUCKETS.findIndex(b => year >= b.min && year <= b.max)
}

// Load question banks (cached in memory, separated by region)
let jpBank: BankQuestion[] | null = null
let globalBank: BankQuestion[] | null = null

function loadBanks(): void {
  if (jpBank !== null) return

  const bankPath = path.join(process.cwd(), 'data', 'questionBank.json')
  if (fs.existsSync(bankPath)) {
    const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'))
    jpBank = raw.questions as BankQuestion[]
  } else {
    jpBank = []
  }

  const globalPath = path.join(process.cwd(), 'data', 'globalQuestionBank.json')
  if (fs.existsSync(globalPath)) {
    const raw = JSON.parse(fs.readFileSync(globalPath, 'utf-8'))
    globalBank = raw.questions as BankQuestion[]
  } else {
    globalBank = []
  }

  console.log(`Loaded question banks: JP=${jpBank.length}, Global=${globalBank!.length}`)
}

function questionsFromBank(count: number, region: 'jp' | 'global' = 'jp', difficulty: 'easy' | 'hard' = 'hard'): TrackQuestion[] {
  loadBanks()
  const pool = region === 'jp' ? jpBank! : globalBank!
  if (pool.length === 0) return []

  const eligible = pool.filter(q =>
    meetsPopularityThreshold(q, difficulty) && meetsTrackPopularity(q, difficulty) && isValidQuestion(q.trackName, q.albumName, q.source === 'single' ? 'single' : 'album')
  )
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
async function questionsFromSpotifyAPI(count: number, market = 'JP'): Promise<TrackQuestion[]> {
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
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=${market}`,
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
      if (!isValidQuestion(track.name, album.name, album.album_type)) return null

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

// Artist-specific mode: fetch all albums from a single artist
async function questionsFromArtist(artistId: string, count: number): Promise<TrackQuestion[]> {
  const token = await getSpotifyToken()
  const headers = { Authorization: `Bearer ${token}` }

  // Fetch all albums with pagination (50 per page)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allAlbums: any[] = []
  let offset = 0
  const pageSize = 50
  while (true) {
    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=JP&limit=${pageSize}&offset=${offset}`,
      { headers }
    )
    if (!albumsRes.ok) break
    const albumsData = await albumsRes.json()
    const items = albumsData.items ?? []
    allAlbums.push(...items)
    if (items.length < pageSize) break
    offset += pageSize
    if (offset >= 200) break // Safety limit
  }

  // Get artist name
  const artistRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    { headers }
  )
  const artistData = artistRes.ok ? await artistRes.json() : { name: 'Unknown' }

  // Build questions from albums
  const questions: TrackQuestion[] = []
  const usedAlbums = new Set<string>()

  for (const album of allAlbums) {
    const year = parseInt((album.release_date ?? '').split('-')[0])
    if (!year || year < 1960) continue
    if (!isValidQuestion(album.name, album.name, album.album_type)) continue

    // Dedupe by album name (avoid deluxe editions etc)
    const normalizedName = album.name.replace(/\s*[\(\[].+[\)\]]\s*/g, '').toLowerCase()
    if (usedAlbums.has(normalizedName)) continue
    usedAlbums.add(normalizedName)

    questions.push({
      trackName: album.name,
      singleName: album.name,
      artistName: artistData.name,
      albumImageUrl: album.images?.[0]?.url,
      releaseYear: year,
      spotifyUrl: album.external_urls?.spotify,
    })
  }

  // Shuffle and limit
  return [...questions].sort(() => Math.random() - 0.5).slice(0, count)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const count = Math.min(parseInt(req.query.count as string) || 10, 15)
  const locale = (req.query.locale as string) || 'ja'
  const region: 'jp' | 'global' = locale.startsWith('ja') ? 'jp' : 'global'
  const difficulty: 'easy' | 'hard' = req.query.difficulty === 'easy' ? 'easy' : 'hard'
  const artistId = req.query.artist as string | undefined

  try {
    let questions: TrackQuestion[]

    if (artistId) {
      // Artist-specific mode
      questions = await questionsFromArtist(artistId, count)
    } else {
      // Normal mode: question bank first, fallback to Spotify API
      questions = questionsFromBank(count, region, difficulty)
      if (questions.length < count) {
        console.log('Question bank unavailable or insufficient, falling back to Spotify API')
        questions = await questionsFromSpotifyAPI(count, region === 'global' ? 'US' : 'JP')
      }
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ questions })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
