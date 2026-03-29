import type { NextApiRequest, NextApiResponse } from 'next'
import { getDailyRankings, saveDailyRanking } from '@/lib/ranking'
import { getTodayDateString } from '@/lib/dailyChallenge'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const date = (req.query.date as string) || getTodayDateString()

  if (req.method === 'GET') {
    try {
      const rankings = await getDailyRankings(date)
      return res.status(200).json({ date, rankings })
    } catch (error) {
      console.error('Get daily rankings error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, score } = req.body
      if (!name || score === undefined) {
        return res.status(400).json({ error: 'name and score are required' })
      }
      await saveDailyRanking(name, score, date)
      return res.status(201).json({ success: true })
    } catch (error) {
      console.error('Save daily ranking error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
