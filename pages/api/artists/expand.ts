import type { NextApiRequest, NextApiResponse } from 'next'
import { getRelatedArtists } from '@/lib/spotify'
import type { Artist } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { seedArtistIds } = req.body

    if (!Array.isArray(seedArtistIds) || seedArtistIds.length === 0) {
      return res.status(400).json({ error: 'seedArtistIds array is required' })
    }

    const seen = new Set<string>()
    const allArtists: Artist[] = []

    for (const seedId of seedArtistIds.slice(0, 10)) {
      const related = await getRelatedArtists(seedId)
      for (const artist of related) {
        if (seen.has(artist.id)) continue
        if (artist.popularity < 20 || artist.popularity > 90) continue
        seen.add(artist.id)
        allArtists.push(artist)
      }
    }

    return res.status(200).json({ artists: allArtists, count: allArtists.length })
  } catch (error) {
    console.error('Expand artists error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
