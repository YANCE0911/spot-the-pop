'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { detectLang, type Lang } from '@/lib/i18n'

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    setLang(detectLang())
  }, [])

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
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent">SOUND IQ</h1>
          <p className="text-zinc-500 text-sm mt-2 tracking-wide">
            How deep is your music knowledge?
          </p>
        </header>

        {/* Game mode cards */}
        <div className="space-y-4 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          {/* Followers mode */}
          <button
            onClick={() => router.push('/game?metric=followers')}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-left hover:border-brand/50 transition-all group card-glow-versus"
          >
            <p className="text-gradient font-black text-2xl tracking-wider mb-2">
              VERSUS
            </p>
            <p className="text-zinc-400 text-sm">
              {lang === 'ja'
                ? '同じくらい人気のアーティストを当てよう！'
                : 'Name an artist with similar popularity'}
            </p>
          </button>

          {/* Year mode */}
          <button
            onClick={() => router.push('/year')}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-left hover:border-accent/50 transition-all group card-glow-timeline"
          >
            <p className="text-gradient-warm font-black text-2xl tracking-wider mb-2">
              TIMELINE
            </p>
            <p className="text-zinc-400 text-sm">
              {lang === 'ja'
                ? 'あの曲、何年にリリースされた？'
                : 'When was that track released?'}
            </p>
          </button>
        </div>

        {/* Ranking link */}
        <div className="text-center animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
          <button
            onClick={() => router.push('/ranking')}
            className="text-zinc-500 hover:text-white text-sm border border-zinc-800 px-4 py-2 rounded-lg transition-colors"
          >
            {lang === 'ja' ? 'ランキングを見る' : 'View Rankings'}
          </button>
        </div>
      </div>
    </main>
  )
}
