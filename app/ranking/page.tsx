'use client'

import { useEffect, useState } from 'react'
import { getTopRankings } from '@/lib/ranking'
import { useRouter } from 'next/navigation'

export default function RankingPage() {
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const top = await getTopRankings()
        setRankings(top)
      } catch (err) {
        console.error('ランキング取得に失敗:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-green-500 text-center">🏆 ランキング</h1>

        {loading ? (
          <p className="text-center mt-10">読み込み中...</p>
        ) : (
          <ul className="space-y-4">
            {rankings.map((entry, i) => (
              <li key={i} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                <span className="font-semibold">{i + 1}位：{entry.name}</span>
                <span className="text-green-400 font-bold">{entry.score}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="text-center mt-10">
          <button
            onClick={() => router.push('/')}
            className="bg-green-500 text-black py-2 px-6 rounded hover:bg-green-400 font-bold"
          >
            トップに戻る
          </button>
        </div>
      </div>
    </main>
  )
}
