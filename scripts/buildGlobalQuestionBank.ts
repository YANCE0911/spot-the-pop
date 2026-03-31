/**
 * Build a global question bank for TIMELINE mode.
 * Full version: singles + albums + top tracks (same depth as JP bank).
 * Supports resume via partial progress file.
 * Run: npx ts-node scripts/buildGlobalQuestionBank.ts
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
dotenv.config()

if (!process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIPY_CLIENT_ID) {
  process.env.SPOTIFY_CLIENT_ID = process.env.SPOTIPY_CLIENT_ID
  process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIPY_CLIENT_SECRET
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

let cachedToken = ''

async function getToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  cachedToken = data.access_token
  return cachedToken
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

type BankQuestion = {
  trackName: string
  albumName: string
  artistName: string
  artistId: string
  albumImageUrl?: string
  releaseYear: number
  spotifyUrl?: string
  artistPopularity: number
  trackPopularity: number
  source: 'single' | 'album' | 'topTrack'
}

// --- Config ---
const DELAY_MS = 200
const MIN_TRACK_POPULARITY = 5
const MAX_ALBUM_TRACKS = 25
const BEST_OF_PATTERN = /\b(best|greatest|hits|remaster(ed)?|collection|anthology|deluxe|live|covers?|tribute|complete|singles|selected|essential|ultimate|definitive|memorial|golden|chronicle|history|works|perfect|super|ultra|all\s*time|decade|ballad|encore|mix|remix|acoustic|instrumental|karaoke|unplugged|session|demo)\b/i

function isBestOf(albumName: string, totalTracks?: number): boolean {
  if (BEST_OF_PATTERN.test(albumName)) return true
  if (totalTracks && totalTracks > MAX_ALBUM_TRACKS) return true
  return false
}

// --- API with retry ---
async function fetchWithRetry(url: string, retries = 5): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    await sleep(DELAY_MS)
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${cachedToken}` } })

      if (res.status === 401) {
        console.warn('  401 — refreshing token...')
        await getToken()
        continue
      }
      if (res.status === 429) {
        const raw = parseInt(res.headers.get('retry-after') || '5')
        if (raw > 60) {
          console.warn(`  Rate limited (${raw}s) — refreshing token and waiting 10s...`)
          await getToken()
          await sleep(10_000)
        } else {
          const wait = Math.min(raw, 30)
          console.warn(`  Rate limited, waiting ${wait}s...`)
          await sleep(wait * 1000)
        }
        continue
      }
      if (!res.ok) {
        console.warn(`  HTTP ${res.status} for ${url.slice(0, 80)}`)
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

// --- Song extraction (mirrors JP bank builder) ---

async function fetchSingles(artist: { id: string; name: string; popularity: number }): Promise<BankQuestion[]> {
  const questions: BankQuestion[] = []
  let url: string | null = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=single&market=US&limit=50`

  let allItems: any[] = []
  for (let page = 0; page < 4 && url; page++) {
    const res = await fetchWithRetry(url)
    if (!res) break
    const data = await res.json()
    allItems = allItems.concat(data.items ?? [])
    url = data.next ?? null
  }

  for (let i = 0; i < allItems.length; i += 20) {
    const chunk = allItems.slice(i, i + 20)
    const ids = chunk.map((a: any) => a.id).join(',')
    const detailRes = await fetchWithRetry(`https://api.spotify.com/v1/albums?ids=${ids}&market=US`)
    if (!detailRes) continue
    const detailData = await detailRes.json()

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

async function fetchAlbums(artist: { id: string; name: string; popularity: number }): Promise<BankQuestion[]> {
  const questions: BankQuestion[] = []
  let url: string | null = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&market=US&limit=50`

  let allItems: any[] = []
  for (let page = 0; page < 4 && url; page++) {
    const res = await fetchWithRetry(url)
    if (!res) break
    const data = await res.json()
    allItems = allItems.concat(data.items ?? [])
    url = data.next ?? null
  }

  for (let i = 0; i < allItems.length; i += 20) {
    const chunk = allItems.slice(i, i + 20)
    const ids = chunk.map((a: any) => a.id).join(',')
    const detailRes = await fetchWithRetry(`https://api.spotify.com/v1/albums?ids=${ids}&market=US`)
    if (!detailRes) continue
    const detailData = await detailRes.json()

    for (const album of (detailData.albums ?? []) as any[]) {
      if (!album) continue
      if (album.album_type === 'compilation') continue
      const year = parseInt((album.release_date ?? '').split('-')[0])
      if (!year || year < 1960) continue
      if (isBestOf(album.name, album.total_tracks)) continue

      const albumPop = album.popularity ?? 0
      const tracks: any[] = album.tracks?.items ?? []
      if (tracks.length === 0) continue

      // Pick up to 3 tracks (first, middle, last)
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

async function fetchTopTracks(artist: { id: string; name: string; popularity: number }): Promise<BankQuestion[]> {
  const questions: BankQuestion[] = []
  const res = await fetchWithRetry(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`)
  if (!res) return questions
  const data = await res.json()

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

// --- Dedup ---
function deduplicateQuestions(questions: BankQuestion[]): BankQuestion[] {
  const seen = new Set<string>()
  return questions.filter(q => {
    const key = `${q.artistId}::${q.trackName.toLowerCase().replace(/\s+/g, ' ').trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// --- Main ---
async function main() {
  console.log('=== Building Global Question Bank (Full) ===')

  // Load global artists
  const globalArtistsRaw = fs.readFileSync('lib/GlobalArtists.ts', 'utf-8')
  const match = globalArtistsRaw.match(/export const GLOBAL_ARTISTS = (\[[\s\S]*\]) as const/)
  if (!match) { console.error('Could not parse GlobalArtists.ts'); process.exit(1) }
  const globalArtists: { id: string; name: string; popularity: number; followers: number }[] = JSON.parse(match[1])

  // Exclude Japanese artists
  const jaArtistsRaw = fs.readFileSync('lib/JapaneseArtists.ts', 'utf-8')
  const jaIds = new Set<string>()
  for (const m of jaArtistsRaw.matchAll(/"id":\s*"([^"]+)"/g)) {
    jaIds.add(m[1])
  }

  const candidates = globalArtists.filter(a => !jaIds.has(a.id) && a.popularity >= 30)
  console.log(`Candidates: ${candidates.length} global artists (excluding ${jaIds.size} Japanese)`)

  await getToken()
  console.log('Spotify token acquired.\n')

  // Resume support
  const partialPath = path.join('data', 'globalQuestionBank.partial.json')
  let allQuestions: BankQuestion[] = []
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

  for (let i = 0; i < candidates.length; i++) {
    processed = i + 1
    if (processed <= startFrom) continue

    const artist = candidates[i]

    // Refresh token every 300 artists
    if (processed > startFrom + 1 && (processed - startFrom) % 300 === 0) {
      await getToken()
    }

    if (processed % 50 === 0 || processed === startFrom + 1) {
      console.log(`\n[${processed}/${candidates.length}] Processing ${artist.name}...`)
    }

    try {
      const singles = await fetchSingles(artist)
      const albums = await fetchAlbums(artist)
      const topTracks = await fetchTopTracks(artist)

      // Detect possible rate limit (all empty after warmup)
      if (singles.length === 0 && albums.length === 0 && topTracks.length === 0 && processed > startFrom + 5) {
        console.warn(`\nAll empty for ${artist.name}, possible rate limit. Saving progress...`)
        rateLimited = true
        break
      }

      allQuestions = allQuestions.concat(singles, albums, topTracks)

      if (processed % 50 === 0) {
        console.log(`  Cumulative: ${allQuestions.length} questions (pre-dedup)`)
        fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed, questions: allQuestions }))
      }
    } catch (e) {
      console.error(`  Error processing ${artist.name}:`, e)
      fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed - 1, questions: allQuestions }))
    }
  }

  if (rateLimited) {
    fs.writeFileSync(partialPath, JSON.stringify({ processedCount: processed - 1, questions: allQuestions }))
    console.log(`Saved partial progress: ${processed - 1} artists, ${allQuestions.length} questions`)
    console.log('Run again to resume.')
  }

  console.log(`\n--- Pre-dedup: ${allQuestions.length} questions ---`)

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

  const uniqueArtists = new Set(deduped.map(q => q.artistId)).size
  console.log('\nBy source:', bySource)
  console.log('By decade:', Object.entries(byDecade).sort(([a], [b]) => a.localeCompare(b)))
  console.log(`Unique artists: ${uniqueArtists}`)
  console.log(`Avg songs/artist: ${(deduped.length / uniqueArtists).toFixed(1)}`)

  const output = {
    metadata: {
      buildDate: new Date().toISOString(),
      totalQuestions: deduped.length,
      uniqueArtists,
      bySource,
      byDecade,
      type: 'global',
    },
    questions: deduped,
  }

  const outPath = path.join('data', 'globalQuestionBank.json')
  fs.writeFileSync(outPath, JSON.stringify(output))
  console.log(`\nSaved to ${outPath}`)
  console.log(`File size: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB`)

  if (!rateLimited && fs.existsSync(partialPath)) {
    fs.unlinkSync(partialPath)
    console.log('Cleaned up partial progress file.')
  }
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
