/**
 * Fetch popular global artists from Spotify and save as a static pool.
 * Run: npx ts-node scripts/fetchGlobalArtists.ts
 */
import * as dotenv from 'dotenv'
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

type ArtistData = {
  name: string
  id: string
  popularity: number
  followers: number
  genres: string[]
  imageUrl: string | null
}

async function searchByGenre(token: string, genre: string, offset = 0): Promise<ArtistData[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&limit=50&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.artists?.items ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres?.slice(0, 3) ?? [],
    imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
  }))
}

async function searchByQuery(token: string, query: string): Promise<ArtistData[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.artists?.items ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres?.slice(0, 3) ?? [],
    imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
  }))
}

const GENRES = [
  'pop', 'rock', 'hip hop', 'r&b', 'electronic', 'indie',
  'latin', 'country', 'metal', 'punk', 'jazz', 'blues',
  'reggae', 'soul', 'funk', 'classical', 'k-pop', 'afrobeats',
]

const QUERIES = [
  'Taylor Swift', 'Drake', 'Ed Sheeran', 'The Weeknd', 'Bad Bunny',
  'BTS', 'Billie Eilish', 'Ariana Grande', 'Coldplay', 'Eminem',
  'Dua Lipa', 'Post Malone', 'Travis Scott', 'Kanye West', 'Rihanna',
  'Beyonce', 'Bruno Mars', 'Lady Gaga', 'Adele', 'Justin Bieber',
  'Doja Cat', 'SZA', 'Olivia Rodrigo', 'Sabrina Carpenter', 'Lana Del Rey',
  'Arctic Monkeys', 'Radiohead', 'Tame Impala', 'Mac DeMarco',
  'Kendrick Lamar', 'Tyler the Creator', 'Frank Ocean', 'The Beatles',
  'Queen', 'Pink Floyd', 'Led Zeppelin', 'Nirvana', 'Oasis',
  'BLACKPINK', 'TWICE', 'Stray Kids', 'NewJeans', 'aespa',
]

async function main() {
  const token = await getToken()
  const allArtists = new Map<string, ArtistData>()

  console.log('Fetching by genre...')
  for (const genre of GENRES) {
    const artists = await searchByGenre(token, genre)
    for (const a of artists) allArtists.set(a.id, a)
    // Also get offset 50 for more variety
    const artists2 = await searchByGenre(token, genre, 50)
    for (const a of artists2) allArtists.set(a.id, a)
    console.log(`  ${genre}: ${artists.length + artists2.length} found (total: ${allArtists.size})`)
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('Fetching by query...')
  for (const q of QUERIES) {
    const artists = await searchByQuery(token, q)
    for (const a of artists) allArtists.set(a.id, a)
    await new Promise(r => setTimeout(r, 50))
  }

  // Filter: only artists with popularity >= 30 and followers >= 10000
  const filtered = [...allArtists.values()]
    .filter(a => a.popularity >= 30 && a.followers >= 10000)
    .sort((a, b) => b.popularity - a.popularity)

  console.log(`\nTotal unique: ${allArtists.size}, filtered: ${filtered.length}`)

  const output = `// Auto-generated global artist pool
// Generated: ${new Date().toISOString()}
// Count: ${filtered.length}

export const GLOBAL_ARTISTS = ${JSON.stringify(filtered, null, 2)} as const
`

  const fs = require('fs')
  fs.writeFileSync('lib/GlobalArtists.ts', output)
  console.log(`Saved ${filtered.length} artists to lib/GlobalArtists.ts`)
}

main().catch(console.error)
