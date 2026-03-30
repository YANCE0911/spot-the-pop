/**
 * Build a global question bank for TIMELINE mode using top tracks from global artists.
 * Run: npx ts-node scripts/buildGlobalQuestionBank.ts
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
dotenv.config()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.SPOTIPY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.SPOTIPY_CLIENT_SECRET

async function getToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

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
  source: 'topTrack'
}

// Load global artists
const globalArtistsRaw = fs.readFileSync('lib/GlobalArtists.ts', 'utf-8')
const match = globalArtistsRaw.match(/export const GLOBAL_ARTISTS = (\[[\s\S]*\]) as const/)
if (!match) { console.error('Could not parse GlobalArtists.ts'); process.exit(1) }
const globalArtists: { id: string; name: string; popularity: number; followers: number }[] = JSON.parse(match[1])

// Also load Japanese artists to check for overlap
const jaArtistsRaw = fs.readFileSync('lib/JapaneseArtists.ts', 'utf-8')
const jaIds = new Set<string>()
for (const m of jaArtistsRaw.matchAll(/"id":\s*"([^"]+)"/g)) {
  jaIds.add(m[1])
}

// Filter to only non-Japanese artists with decent popularity
const candidates = globalArtists.filter(a => !jaIds.has(a.id) && a.popularity >= 40)
console.log(`Candidates: ${candidates.length} global artists (excluding ${jaIds.size} Japanese)`)

async function getTopTracks(token: string, artistId: string): Promise<any[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.tracks ?? []
}

async function getAlbums(token: string, artistId: string): Promise<any[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

async function main() {
  let token = await getToken()
  const allQuestions: BankQuestion[] = []
  let tokenRefreshCount = 0

  for (let i = 0; i < candidates.length; i++) {
    const artist = candidates[i]

    // Refresh token every 500 artists
    if (i > 0 && i % 500 === 0) {
      token = await getToken()
      tokenRefreshCount++
    }

    try {
      const tracks = await getTopTracks(token, artist.id)

      for (const track of tracks.slice(0, 5)) {
        const album = track.album
        if (!album?.release_date) continue
        const year = parseInt(album.release_date.split('-')[0])
        if (!year || year < 1960) continue

        allQuestions.push({
          trackName: track.name,
          albumName: album.name,
          artistName: artist.name,
          artistId: artist.id,
          albumImageUrl: album.images?.[0]?.url,
          releaseYear: year,
          spotifyUrl: track.external_urls?.spotify,
          artistPopularity: artist.popularity,
          trackPopularity: track.popularity ?? 0,
          source: 'topTrack',
        })
      }

      if (i % 50 === 0) {
        console.log(`  ${i}/${candidates.length} artists processed, ${allQuestions.length} questions`)
      }

      // Rate limit: ~10 requests/sec
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      console.error(`Error for ${artist.name}:`, err)
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Deduplicate by trackName + artistName
  const seen = new Set<string>()
  const deduped = allQuestions.filter(q => {
    const key = `${q.trackName.toLowerCase()}|${q.artistName.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\nTotal: ${allQuestions.length} → Deduped: ${deduped.length}`)

  const output = {
    metadata: {
      buildDate: new Date().toISOString(),
      totalQuestions: deduped.length,
      uniqueArtists: new Set(deduped.map(q => q.artistName)).size,
      type: 'global',
    },
    questions: deduped,
  }

  fs.writeFileSync('data/globalQuestionBank.json', JSON.stringify(output))
  console.log(`Saved to data/globalQuestionBank.json`)
}

main().catch(console.error)
