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
            onClick={() => setLang(l => {
              const next = l === 'en' ? 'ja' : 'en'
              localStorage.setItem('soundiq_lang', next)
              return next
            })}
            className="text-xs text-zinc-500 hover:text-white border border-zinc-800 px-2 py-1 rounded transition-colors"
          >
            {lang === 'en' ? 'JA' : 'EN'}
          </button>
        </div>

        {/* Header */}
        <header className="text-center animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent">SOUND IQ</h1>
          <p className="text-zinc-400 text-sm mt-2 tracking-wide italic">
            How deep is your music knowledge?
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#1DB954] inline mr-1 -mt-0.5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            Powered by Spotify API · Created by <a href="https://x.com/sbsysil" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">YANCE</a>
          </p>
        </header>

        {/* Region selector */}
        <div className="flex justify-center animate-[fadeInUp_0.5s_ease-out_0.05s_both]">
          <div className="flex bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => handleRegionChange('jp')}
              className={`flex-1 w-24 py-1 rounded-md text-sm font-bold transition-all ${
                region === 'jp'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              邦楽
            </button>
            <button
              onClick={() => handleRegionChange('global')}
              className={`flex-1 w-24 py-1 rounded-md text-sm font-bold transition-all ${
                region === 'global'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              洋楽
            </button>
          </div>
        </div>

        {/* Game mode cards */}
        <div className="space-y-4 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          {/* TIMELINE — Main mode */}
          <button
            onClick={() => router.push(`/year?region=${region}`)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 text-left hover:border-accent/50 hover:scale-[1.01] transition-all group card-glow-timeline"
          >
            <div className="flex items-end justify-between mb-3">
              <p className="text-gradient-warm font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-accent" />
                TIMELINE
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全10問' : '10 Rounds'}</span>
            </div>
            <p className="text-zinc-400 text-xs">
              {lang === 'ja'
                ? '曲のリリース年を当てるゲーム'
                : 'Guess the release year'}
            </p>
          </button>

          {/* VERSUS — Sub mode */}
          <button
            onClick={() => router.push(`/game?metric=followers&region=${region}`)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 text-left hover:border-brand/50 hover:scale-[1.01] transition-all group card-glow-versus"
          >
            <div className="flex items-end justify-between mb-3">
              <p className="text-gradient font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-brand" />
                VERSUS
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全5問' : '5 Rounds'}</span>
            </div>
            <p className="text-zinc-400 text-xs">
              {lang === 'ja'
                ? 'フォロワー数が近いアーティストを当てるゲーム'
                : 'Match artists by follower count'}
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

        {/* Support link */}
        <div className="text-center animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
          <a
            href="https://buymeacoffee.com/yance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            {lang === 'ja' ? 'Buy Me a Coffee で応援する' : 'Support on Buy Me a Coffee'}
          </a>
        </div>
      </div>
    </main>
  )
}
