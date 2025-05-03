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

const RANKING_COLLECTION = 'ranking'

// 🎯 上位10件を取得
export async function getTopRankings() {
  const q = query(collection(db, RANKING_COLLECTION), orderBy('score'), limit(10))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data())
}

// 📝 名前とスコアを登録（ここにログを追加！）
export async function saveRanking(name: string, score: number) {
  console.log('🔥 saveRanking 実行:', name, score)
  await addDoc(collection(db, RANKING_COLLECTION), {
    name,
    score,
    createdAt: Timestamp.now(),
  })
  console.log('✅ Firestore 登録完了')
}
