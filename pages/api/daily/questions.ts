import type { NextApiRequest, NextApiResponse } from 'next'
import { getDailyQuestions, getTodayDateString } from '@/lib/dailyChallenge'
import { fetchArtistsBatch } from '@/lib/spotify'
import type { Artist } from '@/types'

// Cache daily questions to avoid re-fetching from Spotify
const cache: Record<string, { questions: Artist[]; fetchedAt: number }> = {}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const date = (req.query.date as string) || getTodayDateString()

    // Check cache
    if (cache[date] && Date.now() - cache[date].fetchedAt < 3600_000) {
      return res.status(200).json({ date, questions: cache[date].questions })
    }

    // Get seeded questions from static list
    const baseQuestions = getDailyQuestions(date)

    // Fetch fresh data from Spotify API
    const freshData = await fetchArtistsBatch(baseQuestions.map(q => q.id))

    const questions = baseQuestions.map(q => {
      const fresh = freshData.find(f => f.id === q.id)
      if (fresh) return { ...fresh, nameJa: q.nameJa }
      return q
    })

    // Cache
    cache[date] = { questions, fetchedAt: Date.now() }

    return res.status(200).json({ date, questions })
  } catch (error) {
    console.error('Daily questions error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
