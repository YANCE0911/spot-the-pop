/**
 * buildQuestionBank.ts
 *
 * Spotify APIから全アーティストの曲を取得し、
 * 年当てクイズ用の問題バンク(JSON)を生成するバッチスクリプト。
 *
 * Usage: npx ts-node scripts/buildQuestionBank.ts
 */

require('dotenv').config()

// env remap if needed (next.config.js maps SPOTIPY_ -> SPOTIFY_)
if (!process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIPY_CLIENT_ID) {
  process.env.SPOTIFY_CLIENT_ID = process.env.SPOTIPY_CLIENT_ID
  process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIPY_CLIENT_SECRET
}

import { getSpotifyToken, forceTokenRefresh } from '../lib/spotify'
import { LARGE_JAPANESE_ARTISTS } from '../lib/JapaneseArtists'
import fs from 'fs'
import path from 'path'

// ---------- Types ----------

type Question = {
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

// ---------- Config ----------

const MIN_TRACK_POPULARITY = 5
const BEST_OF_PATTERN = /\b(best|greatest|hits|remaster(ed)?|collection|anthology|deluxe|live|covers?|tribute|complete|singles|selected|essential|ultimate|definitive|memorial|golden|chronicle|history|works|perfect|super|ultra|all\s*time|decade|ballad|encore|mix|remix|acoustic|instrumental|karaoke|unplugged|session|demo)\b/i
const MAX_ALBUM_TRACKS = 25  // Albums with more tracks are likely box sets

// Japanese artist detection
const JP_GENRE_KEYWORDS = [
  'j-pop', 'j-rock', 'j-metal', 'j-dance', 'j-rap', 'j-idol', 'j-div', 'j-punk',
  'japanese', 'anime', 'visual kei', 'enka', 'city pop', 'shibuya', 'okinawan',
  'j-pixie', 'j-ambient', 'j-reggae', 'jpop', 'jrock',
]
const NON_JP_GENRE_KEYWORDS = [
  'k-pop', 'k-indie', 'k-rap', 'k-r&b', 'korean',
  'mandopop', 'c-pop', 'cantopop', 'latin', 'reggaeton', 'punjabi',
]

// Rate limiting
const DELAY_MS = 300  // 300ms between requests = ~3 req/sec

// ---------- Helpers ----------

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isJapaneseArtist(artist: any): boolean {
  const genres: string[] = artist.genres || []
  const genreStr = genres.join(' ').toLowerCase()

  for (const kw of NON_JP_GENRE_KEYWORDS) {
    if (genreStr.includes(kw)) return false
  }
  for (const kw of JP_GENRE_KEYWORDS) {
    if (genreStr.includes(kw)) return true
  }
  if (artist.nameJa) return true

  // No genre signal and no nameJa — skip (likely non-Japanese)
  // Exception: low-follower artists with empty genres might be JP indie
  // But safer to skip for quality
  return false
}

function isBestOf(albumName: string, totalTracks?: number): boolean {
  if (BEST_OF_PATTERN.test(albumName)) return true
  if (totalTracks && totalTracks > MAX_ALBUM_TRACKS) return true
  return false
}

async function fetchWithRetry(url: string, retries = 5): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    await sleep(DELAY_MS)
    try {
      // Always get fresh token (cached internally, auto-refreshes on expiry)
      const currentToken = await getSpotifyToken()
      const res = await fetch(url, { headers: { Authorization: `Bearer ${currentToken}` } })

      if (res.status === 401) {
        // Token expired — force refresh by clearing cache
        console.warn(`  401 Unauthorized, refreshing token...`)
        // Clear the cached token so next getSpotifyToken() fetches a new one
        forceTokenRefresh()
        continue
      }

      if (res.status === 429) {
        const raw = parseInt(res.headers.get('retry-after') || '5')
        if (raw > 60) {
          // Absurdly long retry-after — likely needs new token
          console.warn(`  Rate limited (${raw}s) — refreshing token and waiting 10s...`)
          forceTokenRefresh()
          await sleep(10_000)
        } else {
          const retryAfter = Math.min(raw, 30)
          console.warn(`  Rate limited, waiting ${retryAfter}s...`)
          await sleep(retryAfter * 1000)
        }
        continue
      }

      if (!res.ok) {
        console.warn(`  HTTP ${res.status} for ${url.slice(0, 80)}...`)
        return null
      }
      return res
    } catch (e) {
      console.warn(`  Fetch error (attempt ${i + 1}):`, e)
      await sleep(2000)
    }
  }
  return null
}

// ---------- Song Extraction ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSingles(artist: any): Promise<Question[]> {
  const questions: Question[] = []
  let url: string | null = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=single&market=JP&limit=50`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allItems: any[] = []
  for (let page = 0; page < 4 && url; page++) {
    const res = await fetchWithRetry(url)
    if (!res) break
    const data = await res.json()
    allItems = allItems.concat(data.items ?? [])
    url = data.next ?? null
  }

  // Batch fetch album details for popularity (20 at a time)
  for (let i = 0; i < allItems.length; i += 20) {
    const chunk = allItems.slice(i, i + 20)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = chunk.map((a: any) => a.id).join(',')
    const detailRes = await fetchWithRetry(
      `https://api.spotify.com/v1/albums?ids=${ids}&market=JP`
    )
    if (!detailRes) continue
    const detailData = await detailRes.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const album of (detailData.albums ?? []) as any[]) {
      if (!album) continue
      const year = parseInt((album.release_date ?? '').split('-')[0])
      if (!year || year < 1960) continue
      if (isBestOf(album.name, album.total_tracks)) continue

      const pop = album.popularity ?? 0
      if (pop < MIN_TRACK_POPULARITY) continue

      const firstTrack = album.tracks?.items?.[0]
      questions.push({
        trackName: firstTrack?.name ?? album.name,
        albumName: album.name,
        artistName: artist.name,
        artistNameJa: artist.nameJa,
        artistId: artist.id,
        albumImageUrl: album.images?.[0]?.url,
        releaseYear: year,
        spotifyUrl: firstTrack?.external_urls?.spotify ?? album.external_urls?.spotify,
        artistPopularity: artist.popularity ?? 0,
        trackPopularity: pop,
        source: 'single',
      })
    }
  }

  return questions
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAlbums(artist: any): Promise<Question[]> {
  const questions: Question[] = []
  let url: string | null = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&market=JP&limit=50`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allItems: any[] = []
  for (let page = 0; page < 4 && url; page++) {
    const res = await fetchWithRetry(url)
    if (!res) break
    const data = await res.json()
    allItems = allItems.concat(data.items ?? [])
    url = data.next ?? null
  }

  // Batch fetch album details
  for (let i = 0; i < allItems.length; i += 20) {
    const chunk = allItems.slice(i, i + 20)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = chunk.map((a: any) => a.id).join(',')
    const detailRes = await fetchWithRetry(
      `https://api.spotify.com/v1/albums?ids=${ids}&market=JP`
    )
    if (!detailRes) continue
    const detailData = await detailRes.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const album of (detailData.albums ?? []) as any[]) {
      if (!album) continue
      if (album.album_type === 'compilation') continue

      const year = parseInt((album.release_date ?? '').split('-')[0])
      if (!year || year < 1960) continue
      if (isBestOf(album.name, album.total_tracks)) continue

      const albumPop = album.popularity ?? 0

      // Pick up to 3 tracks from each album (first, middle, last-ish)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks: any[] = album.tracks?.items ?? []
      if (tracks.length === 0) continue

      const indices = [0]
      if (tracks.length > 4) indices.push(Math.floor(tracks.length / 2))
      if (tracks.length > 2) indices.push(tracks.length - 1)

      for (const idx of indices) {
        const track = tracks[idx]
        if (!track) continue

        questions.push({
          trackName: track.name,
          albumName: album.name,
          artistName: artist.name,
          artistNameJa: artist.nameJa,
          artistId: artist.id,
          albumImageUrl: album.images?.[0]?.url,
          releaseYear: year,
          spotifyUrl: track.external_urls?.spotify ?? album.external_urls?.spotify,
          artistPopularity: artist.popularity ?? 0,
          trackPopularity: albumPop,
          source: 'album',
        })
      }
    }
  }

  return questions
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTopTracks(artist: any): Promise<Question[]> {
  const questions: Question[] = []

  const res = await fetchWithRetry(
    `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=JP`
  )
  if (!res) return questions
  const data = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const track of (data.tracks ?? []) as any[]) {
    const album = track.album
    if (!album) continue
    if (album.album_type === 'compilation') continue

    const year = parseInt((album.release_date ?? '').split('-')[0])
    if (!year || year < 1960) continue
    if (isBestOf(album.name, album.total_tracks)) continue

    const pop = track.popularity ?? 0
    if (pop < MIN_TRACK_POPULARITY) continue

    questions.push({
      trackName: track.name,
      albumName: album.name,
      artistName: artist.name,
      artistNameJa: artist.nameJa,
      artistId: artist.id,
      albumImageUrl: album.images?.[0]?.url,
      releaseYear: year,
      spotifyUrl: track.external_urls?.spotify,
      artistPopularity: artist.popularity ?? 0,
      trackPopularity: pop,
      source: 'topTrack',
    })
  }

  return questions
}

// ---------- Deduplication ----------

function deduplicateQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>()
  const result: Question[] = []

  for (const q of questions) {
    // Deduplicate by artist + trackName (normalized)
    const key = `${q.artistId}::${q.trackName.toLowerCase().replace(/\s+/g, ' ').trim()}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(q)
  }

  return result
}

// ---------- Main ----------

async function main() {
  console.log('=== Building Question Bank ===')
  console.log(`Total artists in pool: ${LARGE_JAPANESE_ARTISTS.length}`)

  await getSpotifyToken()
  console.log('Spotify token acquired.\n')

  // Filter to Japanese artists
  const jpArtists = LARGE_JAPANESE_ARTISTS.filter(isJapaneseArtist)
  console.log(`Japanese artists: ${jpArtists.length} / ${LARGE_JAPANESE_ARTISTS.length}`)

  // Resume support: load partial results if they exist
  const partialPath = path.join(__dirname, '..', 'data', 'questionBank.partial.json')
  let allQuestions: Question[] = []
  let startFrom = 0

  if (fs.existsSync(partialPath)) {
    try {
      const partial = JSON.parse(fs.readFileSync(partialPath, 'utf-8'))
      allQuestions = partial.questions ?? []
      startFrom = partial.processedCount ?? 0
      console.log(`Resuming from artist ${startFrom + 1} with ${allQuestions.length} existing questions`)
    } catch {
      console.log('Could not load partial results, starting fresh')
    }
  }

  let processed = 0
  let rateLimited = false

  for (const artist of jpArtists) {
    processed++
    if (processed <= startFrom) continue // Skip already processed

    if (processed % 50 === 0 || processed === startFrom + 1) {
      console.log(`\n[${processed}/${jpArtists.length}] Processing ${artist.name}...`)
    }

    try {
      // Sequential to avoid rate limiting. Token auto-refreshes inside fetchWithRetry.
      const singles = await fetchSingles(artist)
      const albums = await fetchAlbums(artist)
      const topTracks = await fetchTopTracks(artist)

      // Detect if all three returned empty (likely rate limited)
      if (singles.length === 0 && albums.length === 0 && topTracks.length === 0 && processed > startFrom + 5) {
        // Might be rate limited — save and exit
        console.warn(`\nAll empty for ${artist.name}, possible rate limit. Saving progress...`)
        rateLimited = true
        break
      }

      const artistQuestions = [...singles, ...albums, ...topTracks]
      allQuestions = allQuestions.concat(artistQuestions)

      if (processed % 50 === 0) {
        console.log(`  Cumulative: ${allQuestions.length} questions (pre-dedup)`)
        // Save partial progress every 50 artists
        fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed, questions: allQuestions }))
      }
    } catch (e) {
      console.error(`  Error processing ${artist.name}:`, e)
      // Save progress on error too
      fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed - 1, questions: allQuestions }))
    }
  }

  // Save partial on rate limit for next resume
  if (rateLimited) {
    fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed - 1, questions: allQuestions }))
    console.log(`Saved partial progress: ${processed - 1} artists, ${allQuestions.length} questions`)
    console.log('Run again with fresh credentials to resume.')
  }

  console.log(`\n--- Pre-dedup: ${allQuestions.length} questions ---`)

  // Deduplicate
  const deduped = deduplicateQuestions(allQuestions)
  console.log(`Post-dedup: ${deduped.length} questions`)

  // Stats
  const bySource = { single: 0, album: 0, topTrack: 0 }
  const byDecade: Record<string, number> = {}
  for (const q of deduped) {
    bySource[q.source]++
    const decade = `${Math.floor(q.releaseYear / 10) * 10}s`
    byDecade[decade] = (byDecade[decade] || 0) + 1
  }

  console.log('\nBy source:', bySource)
  console.log('By decade:', Object.entries(byDecade).sort(([a], [b]) => a.localeCompare(b)))

  const uniqueArtists = new Set(deduped.map(q => q.artistId)).size
  console.log(`Unique artists: ${uniqueArtists}`)
  console.log(`Avg songs/artist: ${(deduped.length / uniqueArtists).toFixed(1)}`)

  // Save
  const output = {
    metadata: {
      buildDate: new Date().toISOString(),
      totalQuestions: deduped.length,
      uniqueArtists,
      bySource,
      byDecade,
    },
    questions: deduped,
  }

  const outPath = path.join(__dirname, '..', 'data', 'questionBank.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\nSaved to ${outPath}`)
  console.log(`File size: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB`)

  // Clean up partial file on full completion
  if (!rateLimited && fs.existsSync(partialPath)) {
    fs.unlinkSync(partialPath)
    console.log('Cleaned up partial progress file.')
  }
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
