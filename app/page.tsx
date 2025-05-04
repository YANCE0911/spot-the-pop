'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTopRankings } from '@/lib/ranking'
import type { Ranking } from '@/types' // 必要ならこの型定義も作ってね

export default function Home() {
  const router = useRouter()
  const [rankings, setRankings] = useState<Ranking[]>([]) // ← 追加！
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const top = await getTopRankings()
        setRankings(top)
      } catch (err) {
        console.error('🏆 ランキング取得失敗:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  const startGame = () => {
    router.push('/game')
  }

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="mb-12">
          <h1 className="text-green-500 text-5xl font-extrabold text-center mb-10">SPOT THE POP</h1>
          <div className="bg-zinc-800 p-6 rounded-lg text-white space-y-4">
            <p>ランダムに出題される10組のアーティストに対して、より近い「人気度」のアーティストを予想するチャレンジです。</p>
            <p className="text-sm text-zinc-400">
              ※ 各お題との人気度の差が少ないほど高得点。10問の合計スコアで競います。上位10名はランキングに名前が載ります！
            </p>
            <p className="text-sm text-zinc-400">
              ※ 「人気度」は直近1ヶ月の再生回数・リスナー数などを総合的に反映した公式スコアであり、日々変動します。
            </p>
          </div>
        </header>

        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-green-500 text-black py-4 px-8 rounded-lg font-bold text-lg hover:bg-green-400 transition-all"
          >
            チャレンジ開始
          </button>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-green-500 mb-4">🏆 ランキング TOP10</h2>
          {loading ? (
            <p>ランキングを読み込み中...</p>
          ) : (
            <ul className="space-y-2">
              {rankings.map((r, i) => (
                <li key={i} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">{i + 1}位: {r.name}</span>
                  <span className="text-zinc-400">{r.score}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
