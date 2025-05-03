import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { score } = req.body
    
    // ランキングの上位10件を取得
    const rankingRef = collection(db, 'rankings')
    const q = query(rankingRef, orderBy('score', 'asc'), limit(10))
    const querySnapshot = await getDocs(q)
    
    let isHighScore = false
    
    // ランキングが10件未満、または最下位より良いスコアなら登録可能
    if (querySnapshot.size < 10) {
      isHighScore = true
    } else {
      // 最も高いスコア（数値が大きい = 差が大きい = 悪いスコア）
      const highestScore = querySnapshot.docs[querySnapshot.size - 1].data().score
      
      if (score < highestScore) {
        isHighScore = true
      }
    }
    
    return res.status(200).json({ isHighScore })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}