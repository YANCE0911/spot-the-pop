'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { detectLang, type Lang } from '@/lib/i18n'
import ArtistSearch from '@/components/ArtistSearch'
import type { Difficulty } from '@/types'

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')
  const [timelineDifficulty, setTimelineDifficulty] = useState<Difficulty>('easy')
  const [versusDifficulty, setVersusDifficulty] = useState<Difficulty>('easy')
  const [showGuide, setShowGuide] = useState(false)
  const [artistSearchOpen, setArtistSearchOpen] = useState(false)
  const [artistQuery, setArtistQuery] = useState('')

  useEffect(() => {
    const detectedLang = detectLang()
    setLang(detectedLang)
    const savedTl = localStorage.getItem('soundiq_timeline_difficulty') as Difficulty | null
    if (savedTl === 'easy' || savedTl === 'hard') setTimelineDifficulty(savedTl)
    const savedVs = localStorage.getItem('soundiq_versus_difficulty') as Difficulty | null
    if (savedVs === 'easy' || savedVs === 'hard') setVersusDifficulty(savedVs)
    if (!localStorage.getItem('soundiq_visited')) {
      setShowGuide(true)
      localStorage.setItem('soundiq_visited', '1')
    }
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
        <div className="space-y-4 animate-[fadeInUp_0.5s_ease-out_0.1s_both] overflow-visible">
          {/* TIMELINE (display: WHEN?) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 card-glow-timeline relative z-20 overflow-visible">
            <div className="flex items-end justify-between mb-4">
              <p className="text-gradient-warm font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-accent" />
                WHEN?
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全10問' : '10 Rounds'}</span>
            </div>
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
            <div className="flex gap-2 mt-2">
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? 'ヒット曲' : 'Hit songs'}
              </p>
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? '制限なし + 速度ボーナス' : 'No limits + speed bonus'}
              </p>
            </div>
            {!artistSearchOpen ? (
              <button
                onClick={() => setArtistSearchOpen(true)}
                className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
                {lang === 'ja' ? 'アーティスト指定で遊ぶ' : 'Play by Artist'}
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <ArtistSearch
                  key={String(artistSearchOpen)}
                  value={artistQuery}
                  onChange={setArtistQuery}
                  onSelect={(_name, id) => {
                    if (id) router.push(`/year?artist=${id}`)
                  }}
                  placeholder={lang === 'ja' ? 'アーティスト名を検索...' : 'Search artist...'}
                />
                <button
                  onClick={() => { setArtistSearchOpen(false); setArtistQuery('') }}
                  className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {lang === 'ja' ? '閉じる' : 'Cancel'}
                </button>
              </div>
            )}
          </div>

          {/* VERSUS (display: WHO?) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-8 py-5 card-glow-versus relative z-0">
            <div className="flex items-end justify-between mb-4">
              <p className="text-gradient font-display font-black text-3xl tracking-wider flex items-center gap-2">
                <span className="inline-block w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-brand" />
                WHO?
              </p>
              <span className="text-sm font-semibold text-zinc-500">{lang === 'ja' ? '全5問' : '5 Rounds'}</span>
            </div>
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
            <div className="flex gap-2 mt-2">
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? '有名アーティスト' : 'Famous artists'}
              </p>
              <p className="flex-1 text-center text-[10px] text-zinc-500">
                {lang === 'ja' ? '制限なし' : 'No limits'}
              </p>
            </div>
          </div>
        </div>

        {/* Ranking link */}
        <div className="animate-[fadeInUp_0.5s_ease-out_0.2s_both] relative z-0">
          <button
            onClick={() => {
              const lastMode = localStorage.getItem('soundiq_last_mode') || 'timeline'
              const lastDiff = localStorage.getItem('soundiq_last_difficulty') || 'easy'
              router.push(`/ranking?tab=${lastMode}&difficulty=${lastDiff}`)
            }}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold py-3 rounded-xl transition-all"
          >
            {lang === 'ja' ? 'ランキング' : 'Rankings'}
          </button>
        </div>

        {/* Credit & Support */}
        <div className="text-center pt-4 animate-[fadeInUp_0.5s_ease-out_0.3s_both] space-y-2">
          <p className="text-zinc-400 text-sm">
            Created by{' '}
            <a
              href="https://x.com/sbsysil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5 underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
            >
              YANCE
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </p>
          <a
            href="https://buymeacoffee.com/yance"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
          >
            {lang === 'ja' ? (
              <>
                <span className="underline underline-offset-4 decoration-zinc-700 group-hover:decoration-zinc-500">Buy Me a Coffee</span> で応援する
              </>
            ) : (
              <>
                Support on <span className="underline underline-offset-4 decoration-zinc-700 group-hover:decoration-zinc-500">Buy Me a Coffee</span>
              </>
            )}
          </a>
        </div>
      </div>

      {/* First-visit guide popup */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6" onClick={() => setShowGuide(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-black text-xl text-center tracking-tight">
              {lang === 'ja' ? 'SOUND IQ の遊び方' : 'How to Play'}
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-accent font-bold mb-1">WHEN?</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {lang === 'ja'
                    ? '曲のリリース年を当てるクイズ'
                    : 'Guess the release year of each song.'}
                </p>
              </div>

              <div>
                <p className="text-brand font-bold mb-1">WHO?</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {lang === 'ja'
                    ? 'お題アーティストとフォロワー数が近いアーティストを当てるクイズ'
                    : 'Find an artist with a similar follower count to the given artist.'}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-3 text-zinc-500 text-xs leading-relaxed space-y-1">
                <p><span className="text-zinc-400">NORMAL:</span> {lang === 'ja' ? 'ヒット曲・有名アーティスト' : 'Hit songs & famous artists'}</p>
                <p><span className="text-zinc-400">HARD:</span> {lang === 'ja' ? '制限なし（WHEN?は速度ボーナスあり）' : 'No limits (speed bonus on WHEN?)'}</p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-zinc-700 text-zinc-200 font-bold text-sm rounded-lg hover:bg-zinc-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
