// lib/spotify.ts
import type { Artist } from '@/types'

let cachedToken: string | null = null
let tokenExpiry = 0

// In-memory cache for API responses (per serverless instance)
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const searchCache = new Map<string, { data: Artist[]; expires: number }>()
const artistCache = new Map<string, { data: Artist | null; expires: number }>()

function getCachedSearch(key: string): Artist[] | null {
  const entry = searchCache.get(key)
  if (entry && Date.now() < entry.expires) return entry.data
  searchCache.delete(key)
  return null
}

function setCachedSearch(key: string, data: Artist[]) {
  searchCache.set(key, { data, expires: Date.now() + CACHE_TTL })
  // Evict old entries if cache grows too large
  if (searchCache.size > 1000) {
    const oldest = searchCache.keys().next().value
    if (oldest) searchCache.delete(oldest)
  }
}

function getCachedArtist(key: string): Artist | null | undefined {
  const entry = artistCache.get(key)
  if (entry && Date.now() < entry.expires) return entry.data
  artistCache.delete(key)
  return undefined // undefined = not cached, null = cached as not found
}

function setCachedArtist(key: string, data: Artist | null) {
  artistCache.set(key, { data, expires: Date.now() + CACHE_TTL })
  if (artistCache.size > 2000) {
    const oldest = artistCache.keys().next().value
    if (oldest) artistCache.delete(oldest)
  }
}

export function forceTokenRefresh() {
  cachedToken = null
  tokenExpiry = 0
}

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()

  if (!data.access_token) {
    throw new Error('Failed to retrieve Spotify token')
  }

  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken!
}

export async function searchArtist(name: string): Promise<Artist | null> {
  const cacheKey = `search:${name.toLowerCase()}`
  const cached = getCachedArtist(cacheKey)
  if (cached !== undefined) return cached

  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()

  if (!data.artists?.items?.length) {
    setCachedArtist(cacheKey, null)
    return null
  }

  // Try exact match first, then fall back to first result
  const nameLower = name.toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exact = data.artists.items.find((a: any) => a.name.toLowerCase() === nameLower)
  const a = exact ?? data.artists.items[0]
  const artist: Artist = {
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }
  setCachedArtist(cacheKey, artist)
  setCachedArtist(`id:${artist.id}`, artist)
  return artist
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const cacheKey = `id:${id}`
  const cached = getCachedArtist(cacheKey)
  if (cached !== undefined) return cached

  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    setCachedArtist(cacheKey, null)
    return null
  }
  const a = await res.json()
  const artist: Artist = {
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }
  setCachedArtist(cacheKey, artist)
  return artist
}

export async function getRelatedArtists(id: string): Promise<Artist[]> {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.artists ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }))
}

export async function searchArtistsByGenre(genre: string, limit = 50): Promise<Artist[]> {
  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.artists?.items ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }))
}

export async function fetchArtistsBatch(ids: string[]): Promise<Artist[]> {
  if (ids.length === 0) return []
  const token = await getSpotifyToken()
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50))
  }
  const results: Artist[] = []
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) continue
    const data = await res.json()
    for (const a of data.artists ?? []) {
      if (!a) continue
      results.push({
        id: a.id,
        name: a.name,
        popularity: a.popularity,
        followers: a.followers?.total ?? 0,
        genres: a.genres ?? [],
        imageUrl: a.images?.[0]?.url ?? undefined,
      })
    }
  }
  return results
}
