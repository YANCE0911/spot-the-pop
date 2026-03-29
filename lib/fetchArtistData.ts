/**
 * Batch script to fetch and update artist data with genres, followers, and fresh popularity.
 * Run with: npx ts-node lib/fetchArtistData.ts
 */
import { LARGE_JAPANESE_ARTISTS } from './JapaneseArtists'
import * as fs from 'fs'
import * as path from 'path'

const CLIENT_ID = process.env.SPOTIPY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIPY_CLIENT_SECRET

async function getToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

async function fetchBatch(token: string, ids: string[]) {
  const res = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(',')}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    console.error(`API error: ${res.status}`)
    return []
  }
  const data = await res.json()
  return data.artists ?? []
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Set SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET')
    process.exit(1)
  }

  const token = await getToken()
  const artists = [...LARGE_JAPANESE_ARTISTS]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated: any[] = []

  // Fetch in batches of 50
  for (let i = 0; i < artists.length; i += 50) {
    const batch = artists.slice(i, i + 50)
    const ids = batch.map(a => a.id)
    console.log(`Fetching batch ${i / 50 + 1}/${Math.ceil(artists.length / 50)}...`)

    const results = await fetchBatch(token, ids)

    for (const r of results) {
      if (!r) continue
      updated.push({
        name: r.name,
        id: r.id,
        popularity: r.popularity,
        followers: r.followers?.total ?? 0,
        genres: r.genres ?? [],
      })
    }

    // Rate limit safety
    if (i + 50 < artists.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // Also fetch related artists to expand the pool
  console.log('\nFetching related artists to expand pool...')
  const existingIds = new Set(updated.map(a => a.id))
  const seedIds = updated.slice(0, 20).map(a => a.id) // Use top 20 as seeds

  for (const seedId of seedIds) {
    const res = await fetch(`https://api.spotify.com/v1/artists/${seedId}/related-artists`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) continue
    const data = await res.json()

    for (const r of data.artists ?? []) {
      if (existingIds.has(r.id)) continue
      if (r.popularity < 20 || r.popularity > 90) continue
      existingIds.add(r.id)
      updated.push({
        name: r.name,
        id: r.id,
        popularity: r.popularity,
        followers: r.followers?.total ?? 0,
        genres: r.genres ?? [],
      })
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Sort by popularity descending
  updated.sort((a, b) => b.popularity - a.popularity)

  const output = `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(updated, null, 2)} as const\n`
  const outPath = path.join(__dirname, 'JapaneseArtists.ts')
  fs.writeFileSync(outPath, output)

  console.log(`\nDone! ${updated.length} artists written to ${outPath}`)
  console.log(`Original: ${artists.length}, Expanded: ${updated.length - artists.length} new artists`)
}

main().catch(console.error)
