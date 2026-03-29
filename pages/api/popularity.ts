import type { NextApiRequest, NextApiResponse } from 'next'
import { searchArtist, getArtistById } from '@/lib/spotify'
import { LARGE_JAPANESE_ARTISTS } from '@/lib/JapaneseArtists'
import type { Artist } from '@/types'

// Build a lookup map from the static artist pool (for symmetric scoring)
const artistPoolById = new Map<string, Artist>()
const artistPoolByName = new Map<string, Artist>()
for (const a of LARGE_JAPANESE_ARTISTS) {
  const artist: Artist = {
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    followers: a.followers,
    genres: a.genres ? [...a.genres] : [],
    imageUrl: a.imageUrl,
    nameJa: (a as unknown as { nameJa?: string }).nameJa,
  }
  artistPoolById.set(a.id, artist)
  artistPoolByName.set(a.name.toLowerCase(), artist)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const artistId = req.query.id as string
  const artistName = req.query.artist as string

  if (!artistId && !artistName) {
    return res.status(400).json({ error: 'Artist name or id is required' })
  }

  try {
    // Check static pool first (symmetric with theme artists)
    if (artistId) {
      const poolArtist = artistPoolById.get(artistId)
      if (poolArtist) {
        return res.status(200).json(poolArtist)
      }
    }

    // Fall back to Spotify API for artists not in pool
    const artist = artistId
      ? await getArtistById(artistId)
      : await searchArtist(artistName)

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' })
    }

    // Check if the search result matches a pool artist by ID
    const poolMatch = artistPoolById.get(artist.id)
    if (poolMatch) {
      return res.status(200).json(poolMatch)
    }

    return res.status(200).json({
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity,
      followers: artist.followers,
      genres: artist.genres,
      imageUrl: artist.imageUrl,
    })
  } catch (error) {
    console.error('Error fetching artist:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
