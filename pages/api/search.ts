import type { NextApiRequest, NextApiResponse } from 'next'
import { getSpotifyToken } from '@/lib/spotify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = req.query.q as string
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  try {
    const token = await getSpotifyToken()
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!spotifyRes.ok) {
      return res.status(502).json({ error: 'Spotify API error' })
    }

    const data = await spotifyRes.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artists = (data.artists?.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      genres: a.genres?.slice(0, 2) ?? [],
      followers: a.followers?.total ?? 0,
      imageUrl: a.images?.[2]?.url ?? a.images?.[0]?.url ?? null,
    }))

    return res.status(200).json({ artists })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
