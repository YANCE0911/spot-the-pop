// lib/challenge.ts
import { db } from './firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import type { Artist, MetricMode } from '@/types'

const CHALLENGES_COLLECTION = 'challenges'

function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createChallenge(
  questions: Artist[],
  metric: MetricMode,
  creatorName: string,
  creatorScore: number,
  genre?: string
): Promise<string> {
  const id = generateId()
  await setDoc(doc(db, CHALLENGES_COLLECTION, id), {
    questions: questions.map(q => ({
      id: q.id,
      name: q.name,
      popularity: q.popularity,
      followers: q.followers ?? 0,
      genres: q.genres ?? [],
    })),
    metric,
    genre: genre ?? null,
    creatorName,
    creatorScore,
    results: [],
    createdAt: Timestamp.now(),
  })
  return id
}

export async function getChallenge(id: string) {
  const snap = await getDoc(doc(db, CHALLENGES_COLLECTION, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function addChallengeResult(
  id: string,
  name: string,
  score: number
) {
  await updateDoc(doc(db, CHALLENGES_COLLECTION, id), {
    results: arrayUnion({ name, score, createdAt: new Date().toISOString() }),
  })
}
