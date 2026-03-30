import type { NextApiRequest, NextApiResponse } from 'next'
import { getSpotifyToken } from '@/lib/spotify'
import { LARGE_JAPANESE_ARTISTS } from '@/lib/JapaneseArtists'
import type { Artist } from '@/types'

// Pre-build static pool for fast local search
const staticPool: Array<Artist & { nameJa?: string }> = LARGE_JAPANESE_ARTISTS.map(a => ({
  id: a.id,
  name: a.name,
  popularity: a.popularity,
  followers: a.followers,
  genres: a.genres ? [...a.genres] : [],
  imageUrl: (a as unknown as { imageUrl?: string }).imageUrl,
  nameJa: (a as unknown as { nameJa?: string }).nameJa,
}))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = (req.query.q as string ?? '').trim()
  if (query.length < 2) {
    return res.status(200).json({ artists: [] })
  }

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

  // 2. Fall back to Spotify Search API for remaining slots
  const localIds = new Set(localMatches.map(a => a.id))
  let spotifyResults: Array<{ id: string; name: string; genres: string[]; followers: number; imageUrl: string | null }> = []

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
    }
  } catch {
    // Spotify API failed — return local results only
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
