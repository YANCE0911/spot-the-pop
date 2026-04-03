import type { NextApiRequest, NextApiResponse } from 'next'
import { getRandomArtist } from '@/lib/getRandomArtist'
import type { GenreCategory, Difficulty } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const count = Math.min(Number(req.query.count) || 5, 20)
    const genre = (req.query.genre as GenreCategory) || 'all'
    const locale = (req.query.locale as string) || 'ja'
    const region: 'jp' | 'global' = locale.startsWith('ja') ? 'jp' : 'global'
    const difficulty: Difficulty = req.query.difficulty === 'easy' ? 'easy' : 'hard'

    const artists = await getRandomArtist(count, genre, region, difficulty)

    return res.status(200).json({ artists })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
