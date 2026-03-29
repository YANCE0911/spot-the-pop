'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSeason0Rankings } from '@/lib/ranking'
import type { Ranking } from '@/types'
import { detectLang, type Lang } from '@/lib/i18n'

export default function Season0Page() {
  const router = useRouter()
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Lang>('en')
  useEffect(() => { setLang(detectLang()) }, [])

  useEffect(() => {
    getSeason0Rankings(10)
      .then(setRankings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-8">
        <header className="text-center animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-brand text-2xl font-bold">SEASON 0</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {lang === 'ja'
              ? 'スコア = お題との人気度の差（低いほど上位）'
              : 'Score = difference from target (lower is better)'}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-brand rounded-full border-t-transparent" />
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-zinc-600 text-center py-4">
            {lang === 'ja' ? 'データがありません' : 'No data available'}
          </p>
        ) : (
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg animate-[fadeInLeft_0.3s_ease-out] ${
                  i < 3 ? 'bg-zinc-900 border border-zinc-700' : 'bg-zinc-900/60'
                }`}
                style={{ animationDelay: `${200 + i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 text-center font-bold ${
                    i < 3 ? 'text-brand text-lg' : 'text-zinc-500 text-sm'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`font-semibold ${i < 3 ? 'text-white' : 'text-zinc-300'}`}>
                    {r.name}
                  </span>
                </div>
                <span className={`font-mono font-bold ${
                  i < 3 ? 'text-brand' : 'text-zinc-400'
                }`}>
                  {r.score}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.push('/ranking/history')}
            className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
          >
            {lang === 'ja' ? '戻る' : 'Back'}
          </button>
        </div>
      </div>
    </main>
  )
}
