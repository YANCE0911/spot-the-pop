import type { NextApiRequest, NextApiResponse } from 'next';
import { getRandomArtist } from '@/lib/getRandomArtist';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const count = Number(req.query.count) || 1;
    const safeCount = Math.min(count, 20);
    
    const artists = await getRandomArtist(safeCount);
    
    return res.status(200).json({ artists });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}