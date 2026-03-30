import type { NextApiRequest, NextApiResponse } from 'next'
import { getSpotifyToken } from '@/lib/spotify'
import { LARGE_JAPANESE_ARTISTS } from '@/lib/JapaneseArtists'
import { GLOBAL_ARTISTS } from '@/lib/GlobalArtists'
import type { Artist } from '@/types'

// Pre-build static pool for fast local search (Japanese + Global, deduplicated)
const poolIds = new Set<string>()
const staticPool: Array<Artist & { nameJa?: string }> = []

for (const a of LARGE_JAPANESE_ARTISTS) {
  poolIds.add(a.id)
  staticPool.push({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers,
    genres: a.genres ? [...a.genres] : [],
    imageUrl: (a as unknown as { imageUrl?: string }).imageUrl,
    nameJa: (a as unknown as { nameJa?: string }).nameJa,
  })
}

for (const a of GLOBAL_ARTISTS) {
  if (poolIds.has(a.id)) continue
  poolIds.add(a.id)
  staticPool.push({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers,
    genres: [...a.genres],
    imageUrl: a.imageUrl ?? undefined,
  })
}

// Cache for Spotify search results (1 hour TTL, per instance)
type SpotifyResult = { id: string; name: string; genres: string[]; followers: number; imageUrl: string | null }
const spotifySearchCache = new Map<string, { data: SpotifyResult[]; expires: number }>()

function getCachedSpotifySearch(key: string): SpotifyResult[] | null {
  const entry = spotifySearchCache.get(key)
  if (entry && Date.now() < entry.expires) return entry.data
  spotifySearchCache.delete(key)
  return null
}

function setCachedSpotifySearch(key: string, data: SpotifyResult[]) {
  spotifySearchCache.set(key, { data, expires: Date.now() + 60 * 60 * 1000 })
  if (spotifySearchCache.size > 500) {
    const oldest = spotifySearchCache.keys().next().value
    if (oldest) spotifySearchCache.delete(oldest)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = (req.query.q as string ?? '').trim()
  if (query.length < 2) {
    return res.status(200).json({ artists: [] })
  }

  // Set Cache-Control header for browser/CDN caching
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  const qLower = query.toLowerCase()

  // 1. Search static pool first (name or nameJa partial match)
  const localMatches = staticPool.filter(a =>
    a.name.toLowerCase().includes(qLower) ||
    (a.nameJa && a.nameJa.includes(query))
  ).slice(0, 8)

  // If we have enough local results, skip Spotify API
  if (localMatches.length >= 5) {
    return res.status(200).json({
      artists: localMatches.map(({ id, name, genres, followers, imageUrl }) => ({
        id, name, genres: genres?.slice(0, 2) ?? [], followers, imageUrl: imageUrl ?? null,
      })),
    })
  }

  // 2. Fall back to Spotify Search API for remaining slots (with cache)
  const localIds = new Set(localMatches.map(a => a.id))
  let spotifyResults: SpotifyResult[] = []

  const cacheKey = qLower
  const cached = getCachedSpotifySearch(cacheKey)

  if (cached) {
    spotifyResults = cached
  } else {
    try {
      const token = await getSpotifyToken()
      const spotifyRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (spotifyRes.ok) {
        const data = await spotifyRes.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spotifyResults = (data.artists?.items ?? []).map((a: any) => ({
          id: a.id,
          name: a.name,
          genres: a.genres?.slice(0, 2) ?? [],
          followers: a.followers?.total ?? 0,
          imageUrl: a.images?.[2]?.url ?? a.images?.[0]?.url ?? null,
        }))
        setCachedSpotifySearch(cacheKey, spotifyResults)
      }
    } catch {
      // Spotify API failed — return local results only
    }
  }

  // Merge: local first, then Spotify (deduplicated)
  const merged = localMatches.map(({ id, name, genres, followers, imageUrl }) => ({
    id, name, genres: genres?.slice(0, 2) ?? [], followers, imageUrl: imageUrl ?? null,
  }))
  for (const a of spotifyResults) {
    if (!localIds.has(a.id) && merged.length < 8) {
      merged.push(a)
    }
  }

  return res.status(200).json({ artists: merged })
}
