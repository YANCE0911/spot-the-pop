'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTopRankings } from '@/lib/ranking'
import type { Ranking } from '@/types'
import { t, detectLang, type Lang } from '@/lib/i18n'

export default function Home() {
  const router = useRouter()
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    setLang(detectLang())
    getTopRankings(5).then(setRankings).catch(console.error).finally(() => setLoading(false))
  }, [])

  const startGame = () => {
    router.push('/game?metric=followers')
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 font-sans">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Language toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ja' : 'en')}
            className="text-xs text-zinc-500 hover:text-white border border-zinc-800 px-2 py-1 rounded transition-colors"
          >
            {lang === 'en' ? 'JA' : 'EN'}
          </button>
        </div>

        {/* Header */}
        <header className="text-center animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-brand text-4xl sm:text-5xl font-black tracking-tight">SPOT THE POP</h1>
          <p className="text-zinc-400 text-sm mt-2">{t('tagline', lang)}</p>
        </header>

        {/* Game mode buttons */}
        <div className="space-y-3 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          <button
            onClick={startGame}
            className="w-full bg-brand text-black py-4 px-6 rounded-xl font-bold text-lg hover:bg-brand-light transition-all"
          >
            {t('startGame', lang)}
          </button>

        </div>

        {/* Rules */}
        <div className="bg-zinc-900 p-4 rounded-xl text-sm text-zinc-400 space-y-1 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
          <p>{t('rules', lang)}</p>
          <p className="text-xs text-zinc-600">
            {t('rulesFollowers', lang)}
          </p>
        </div>

        {/* Rankings */}
        <section className="animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
          <h2 className="text-lg font-bold text-brand mb-3">
            {t('rankingTitle', lang)} <span className="text-xs text-zinc-500 font-normal">SEASON 1</span>
          </h2>
          {loading ? (
            <p className="text-zinc-500 text-sm">{t('loading', lang)}</p>
          ) : rankings.length === 0 ? (
            <p className="text-zinc-600 text-sm">No rankings yet</p>
          ) : (
            <div className="space-y-2">
              {rankings.map((r, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 p-3 rounded-lg flex justify-between items-center animate-[fadeInLeft_0.3s_ease-out]"
                  style={{ animationDelay: `${400 + i * 30}ms`, animationFillMode: 'both' }}
                >
                  <span className="font-semibold">
                    <span className="text-brand mr-2">{i + 1}</span>
                    {r.name}
                  </span>
                  <span className="text-zinc-400 font-mono text-sm">{r.score}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/ranking/history')}
            className="w-full mt-3 text-sm text-zinc-500 hover:text-brand transition-colors"
          >
            {lang === 'ja' ? '歴代ランキングを見る →' : 'View Hall of Fame →'}
          </button>
        </section>
      </div>
    </main>
  )
}
