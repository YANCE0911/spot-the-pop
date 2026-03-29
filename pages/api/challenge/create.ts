import type { NextApiRequest, NextApiResponse } from 'next'
import { createChallenge } from '@/lib/challenge'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { questions, metric, genre, creatorName, creatorScore } = req.body

    if (!questions?.length || !creatorName || creatorScore === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const challengeId = await createChallenge(
      questions,
      metric || 'popularity',
      creatorName,
      creatorScore,
      genre
    )

    return res.status(201).json({
      challengeId,
      url: `/challenge/${challengeId}`,
    })
  } catch (error) {
    console.error('Create challenge error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
