'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { detectLang, type Lang } from '@/lib/i18n'

type Region = 'jp' | 'global'

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')
  const [region, setRegion] = useState<Region>('jp')

  useEffect(() => {
    const detectedLang = detectLang()
    setLang(detectedLang)
    // Restore saved region, or default based on language
    const saved = localStorage.getItem('soundiq_region') as Region | null
    if (saved === 'jp' || saved === 'global') {
      setRegion(saved)
    } else {
      setRegion(detectedLang === 'ja' ? 'jp' : 'global')
    }
  }, [])

  const handleRegionChange = (r: Region) => {
    setRegion(r)
    localStorage.setItem('soundiq_region', r)
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
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent">SOUND IQ</h1>
          <p className="text-zinc-500 text-sm mt-2 tracking-wide">
            How deep is your music knowledge?
          </p>
        </header>

        {/* Region selector */}
        <div className="flex justify-center animate-[fadeInUp_0.5s_ease-out_0.05s_both]">
          <div className="flex bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => handleRegionChange('jp')}
              className={`flex-1 w-24 py-1.5 rounded-md text-sm font-bold transition-all ${
                region === 'jp'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              JAPAN
            </button>
            <button
              onClick={() => handleRegionChange('global')}
              className={`flex-1 w-24 py-1.5 rounded-md text-sm font-bold transition-all ${
                region === 'global'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              GLOBAL
            </button>
          </div>
        </div>

        {/* Game mode cards */}
        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest text-center animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          {lang === 'ja' ? 'ゲームを選ぶ' : 'Select Game'}
        </p>
        <div className="space-y-4 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          {/* TIMELINE — Main mode */}
          <button
            onClick={() => router.push(`/year?region=${region}`)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 text-left hover:border-accent/50 hover:scale-[1.01] transition-all group card-glow-timeline"
          >
            <p className="text-gradient-warm font-display font-black text-3xl tracking-wider mb-3 flex items-center gap-2">
              <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-accent" />
              TIMELINE
            </p>
            <p className="text-zinc-400 text-xs">
              {lang === 'ja'
                ? 'あの曲、何年にリリースされた？'
                : 'When was that track released?'}
            </p>
          </button>

          {/* VERSUS — Sub mode */}
          <button
            onClick={() => router.push(`/game?metric=followers&region=${region}`)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 text-left hover:border-brand/50 hover:scale-[1.01] transition-all group card-glow-versus"
          >
            <p className="text-gradient font-display font-black text-3xl tracking-wider mb-3 flex items-center gap-2">
              <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-brand" />
              VERSUS
            </p>
            <p className="text-zinc-400 text-xs">
              {lang === 'ja'
                ? '同じくらい人気のアーティストを当てよう！'
                : 'Name an artist with similar popularity'}
            </p>
          </button>
        </div>

        {/* Ranking link */}
        <div className="animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
          <button
            onClick={() => router.push('/ranking')}
            className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm py-3 rounded-xl transition-all"
          >
            {lang === 'ja' ? 'ランキング' : 'Rankings'}
          </button>
        </div>
      </div>
    </main>
  )
}
