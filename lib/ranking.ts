// lib/ranking.ts
import { db } from './firebase'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from 'firebase/firestore'
import type { Ranking } from '@/types' // ← 型を使う！

const RANKING_COLLECTION = 'ranking'

export async function getTopRankings(): Promise<Ranking[]> {
  const q = query(collection(db, RANKING_COLLECTION), orderBy('score'), limit(10))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as Ranking) // ← 型を明示！
}

export async function saveRanking(name: string, score: number) {
  await addDoc(collection(db, RANKING_COLLECTION), {
    name,
    score,
    createdAt: Timestamp.now(),
  })
}
