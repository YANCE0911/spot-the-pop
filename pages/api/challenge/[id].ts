import type { NextApiRequest, NextApiResponse } from 'next'
import { getChallenge, addChallengeResult } from '@/lib/challenge'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Challenge ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const challenge = await getChallenge(id)
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' })
      }
      return res.status(200).json(challenge)
    } catch (error) {
      console.error('Get challenge error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, score } = req.body
      if (!name || score === undefined) {
        return res.status(400).json({ error: 'name and score are required' })
      }
      await addChallengeResult(id, name, score)
      const updated = await getChallenge(id)
      return res.status(200).json(updated)
    } catch (error) {
      console.error('Submit challenge result error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
