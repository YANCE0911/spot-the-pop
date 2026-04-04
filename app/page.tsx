'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { detectLang, type Lang } from '@/lib/i18n'
import type { Difficulty } from '@/types'

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')
  const [timelineDifficulty, setTimelineDifficulty] = useState<Difficulty>('easy')
  const [versusDifficulty, setVersusDifficulty] = useState<Difficulty>('easy')

  useEffect(() => {
    const detectedLang = detectLang()
    setLang(detectedLang)
    const savedTl = localStorage.getItem('soundiq_timeline_difficulty') as Difficulty | null
    if (savedTl === 'easy' || savedTl === 'hard') setTimelineDifficulty(savedTl)
    const savedVs = localStorage.getItem('soundiq_versus_difficulty') as Difficulty | null
    if (savedVs === 'easy' || savedVs === 'hard') setVersusDifficulty(savedVs)
  }, [])

  const playTimeline = (diff: Difficulty) => {
    setTimelineDifficulty(diff)
    localStorage.setItem('soundiq_timeline_difficulty', diff)
    localStorage.setItem('soundiq_last_mode', 'timeline')
    localStorage.setItem('soundiq_last_difficulty', diff)
    router.push(`/year?difficulty=${diff}`)
  }

  const playVersus = (diff: Difficulty) => {
    setVersusDifficulty(diff)
    localStorage.setItem('soundiq_versus_difficulty', diff)
    localStorage.setItem('soundiq_last_mode', 'versus')
    localStorage.setItem('soundiq_last_difficulty', diff)
    router.push(`/game?metric=followers&difficulty=${diff}`)
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 font-sans">
      <div className="max-w-lg mx-auto space-y-5">
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
        </header>

        {/* Game mode cards */}
        <div className="space-y-4 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
          {/* TIMELINE */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 card-glow-timeline">
            <div className="flex items-end justify-between mb-3">
              <p className="text-gradient-warm font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-accent" />
                TIMELINE
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全10問' : '10 Rounds'}</span>
            </div>
            <p className="text-zinc-400 text-xs mb-4">
              {lang === 'ja'
                ? '曲のリリース年を当てるゲーム'
                : 'Guess the release year'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => playTimeline('easy')}
                className="btn-normal-timeline flex-1 py-3 rounded-lg text-sm font-bold transition-all active:scale-[0.97] bg-accent text-black hover:brightness-110"
              >
                NORMAL
              </button>
              <button
                onClick={() => playTimeline('hard')}
                className="btn-hard-timeline flex-1 py-3 rounded-lg text-sm font-bold tracking-widest transition-all active:scale-[0.93] bg-black border-2 border-accent/70 text-accent shadow-[0_0_16px_rgba(168,85,247,0.25),0_0_4px_rgba(168,85,247,0.15)] hover:shadow-[0_0_24px_rgba(168,85,247,0.4),0_0_8px_rgba(168,85,247,0.25)] hover:border-accent"
              >
                HARD
              </button>
            </div>
            <div className="flex gap-2 mt-2.5">
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? 'ヒット曲のみ' : 'Hits only'}
              </p>
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? 'ディープな選曲 + 速度ボーナス' : 'Deep cuts + speed bonus'}
              </p>
            </div>
          </div>

          {/* VERSUS */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 card-glow-versus">
            <div className="flex items-end justify-between mb-3">
              <p className="text-gradient font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-brand" />
                VERSUS
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全5問' : '5 Rounds'}</span>
            </div>
            <p className="text-zinc-400 text-xs mb-4">
              {lang === 'ja'
                ? 'フォロワー数が近いアーティストを当てるゲーム'
                : 'Match artists by follower count'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => playVersus('easy')}
                className="btn-normal-versus flex-1 py-3 rounded-lg text-sm font-bold transition-all active:scale-[0.97] bg-brand text-black hover:brightness-110"
              >
                NORMAL
              </button>
              <button
                onClick={() => playVersus('hard')}
                className="btn-hard-versus flex-1 py-3 rounded-lg text-sm font-bold tracking-widest transition-all active:scale-[0.93] bg-black border-2 border-brand/70 text-brand shadow-[0_0_16px_rgba(29,185,84,0.25),0_0_4px_rgba(29,185,84,0.15)] hover:shadow-[0_0_24px_rgba(29,185,84,0.4),0_0_8px_rgba(29,185,84,0.25)] hover:border-brand"
              >
                HARD
              </button>
            </div>
            <div className="flex gap-2 mt-2.5">
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? '有名アーティスト' : 'Famous artists'}
              </p>
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? 'ディープなアーティスト' : 'Deep roster'}
              </p>
            </div>
          </div>
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
        <div className="text-center pt-2 animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
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
