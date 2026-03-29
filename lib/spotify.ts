// lib/spotify.ts
import type { Artist } from '@/types'

let cachedToken: string | null = null
let tokenExpiry = 0

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
  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()

  if (!data.artists?.items?.length) return null

  const a = data.artists.items[0]
  return {
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const a = await res.json()
  return {
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres ?? [],
    imageUrl: a.images?.[0]?.url ?? undefined,
  }
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
