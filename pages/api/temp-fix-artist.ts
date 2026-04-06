import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: list all entries for an artist
  if (req.method === 'GET') {
    const artistId = req.query.artistId as string
    if (!artistId) return res.status(400).json({ error: 'Missing artistId' })
    try {
      const q = query(collection(db, 'artist_plays'), where('artistId', '==', artistId))
      const snapshot = await getDocs(q)
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return res.status(200).json(entries)
    } catch (e) {
      return res.status(500).json({ error: String(e) })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { artistId, deletePlayerId, updatePlayerId, newScore } = req.body
  if (!artistId || !deletePlayerId || !updatePlayerId || !newScore) {
    return res.status(400).json({ error: 'Missing params' })
  }

  try {
    const q = query(
      collection(db, 'artist_plays'),
      where('artistId', '==', artistId),
    )
    const snapshot = await getDocs(q)

    let deleted = 0
    let updated = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()
      if (data.playerId === deletePlayerId) {
        await deleteDoc(doc.ref)
        deleted++
      } else if (data.playerId === updatePlayerId) {
        await updateDoc(doc.ref, { score: newScore, createdAt: Timestamp.now() })
        updated++
      }
    }

    return res.status(200).json({ deleted, updated })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
}
