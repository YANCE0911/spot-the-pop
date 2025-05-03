// pages/api/popularity.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSpotifyToken } from '@/lib/spotify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const artistName = req.query.artist as string;
  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    const token = await getSpotifyToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!data.artists || data.artists.items.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const artist = data.artists.items[0];

    return res.status(200).json({
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity,
    });
  } catch (error) {
    console.error('Error fetching artist popularity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
