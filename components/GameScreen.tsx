'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from './Timer'
import HintPanel from './HintPanel'
import ArtistSearch from './ArtistSearch'
import Logo from './Logo'
import type { MetricMode, Artist } from '@/types'
import { t, type Lang } from '@/lib/i18n'
import { getHintRange } from '@/lib/metrics'

type Props = {
  currentRound: number
  totalRounds: number
  themeArtist: Artist
  onSubmitAnswer: (artistName: string, artistId?: string) => Promise<void>
  metric?: MetricMode
  timer?: number
  onTimeout?: () => void
  lang?: Lang
  totalScore?: number
}

export default function GameScreen({
  currentRound,
  totalRounds,
  themeArtist,
  onSubmitAnswer,
  metric = 'followers',
  timer,
  onTimeout,
  lang = 'en',
  totalScore = 0,
}: Props) {
  const [answer, setAnswer] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [usedHints, setUsedHints] = useState<Set<string>>(new Set())
  const [inputFocused, setInputFocused] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!answer.trim()) return
    setLoading(true)
    await onSubmitAnswer(answer, selectedId)
    setAnswer('')
    setSelectedId(undefined)
    setLoading(false)
    setUsedHints(new Set())
  }

  const handleUseHint = (type: 'genre' | 'range') => {
    setUsedHints(prev => new Set(prev).add(type))
  }

  const handleTimeout = () => {
    if (onTimeout) onTimeout()
    setUsedHints(new Set())
  }

  const handleSelectFromSearch = (name: string, id?: string) => {
    setAnswer(name)
    setSelectedId(id)
  }

  // iOS Safari keyboard fix: use visualViewport to track actual visible area
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const el = mainRef.current
      if (!el) return
      el.style.height = `${vv.height}px`
      el.style.top = `${vv.offsetTop}px`
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  if (!themeArtist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand rounded-full border-t-transparent" />
      </div>
    )
  }

  const metricLabel = t(metric === 'followers' ? 'followers' : 'popularity', lang)

  return (
    <main ref={mainRef} className="fixed left-0 right-0 top-0 bg-black text-white px-4 pt-2 pb-2 font-sans flex flex-col" style={{ height: '100%' }}>
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1 min-h-0">
        <header className="flex-shrink-0 transition-all duration-200">
          {/* Full header — hidden when keyboard open */}
          {!inputFocused && (
            <div className="flex items-center justify-between mb-2">
              <Logo />
              <div className="flex items-center gap-3">
                {timer && (
                  <Timer
                    key={currentRound}
                    duration={timer}
                    onTimeout={handleTimeout}
                    isRunning={!loading}
                  />
                )}
                <div className="text-right">
                  <span className="text-xs text-zinc-400">{t('round', lang)}</span>
                  <div className="text-xl font-bold">{currentRound}/{totalRounds}</div>
                </div>
              </div>
            </div>
          )}

          {/* Compact header — shown when keyboard open */}
          {inputFocused && (
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-zinc-400">{t('round', lang)} {currentRound}/{totalRounds}</span>
              {timer && (
                <Timer
                  key={currentRound}
                  duration={timer}
                  onTimeout={handleTimeout}
                  isRunning={!loading}
                />
              )}
              {totalScore > 0 && <span className="text-brand font-semibold">SCORE: {Math.round(totalScore)}</span>}
            </div>
          )}

          {/* Score bar — hidden when keyboard open */}
          {!inputFocused && totalScore > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-brand font-semibold">TOTAL SCORE</span>
                <span className="text-zinc-400 font-mono">? / 100</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-brand/60 h-full rounded-full"
                  animate={{ width: `${Math.min(totalScore, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-zinc-900 p-5 rounded-xl"
            >
              {/* Artist info with image */}
              <div className="mb-4">
                <h2 className="text-brand text-xs font-semibold uppercase tracking-wide mb-2">
                  {t('themeArtist', lang)}
                </h2>
                {/* Artist image — shrinks when keyboard open */}
                {themeArtist.imageUrl ? (
                  <div className="flex justify-center mb-3 transition-all duration-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={themeArtist.imageUrl}
                      alt={themeArtist.name}
                      className={`rounded-full object-cover shadow-lg shadow-brand/10 transition-all duration-200 ${
                        inputFocused ? 'w-16 h-16' : 'w-40 h-40'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center mb-3">
                    <div className={`rounded-full bg-zinc-700 flex items-center justify-center text-4xl text-zinc-500 transition-all duration-200 ${
                      inputFocused ? 'w-16 h-16 text-xl' : 'w-40 h-40'
                    }`}>?</div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold truncate">{themeArtist.name}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-brand text-xs font-semibold uppercase">{metricLabel}</div>
                    <div className="text-xl font-bold">?</div>
                  </div>
                </div>
              </div>

              {/* Hints — hidden when keyboard open to save space */}
              {timer && !inputFocused && (
                <div className="mb-4">
                  <HintPanel
                    genres={themeArtist.genres ?? []}
                    metricRange={getHintRange(
                      metric === 'followers' ? (themeArtist.followers ?? 0) : themeArtist.popularity,
                      metric
                    )}
                    onUseHint={handleUseHint}
                    usedHints={usedHints}
                    lang={lang}
                  />
                </div>
              )}

              {/* Answer form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-brand text-xs font-semibold block mb-1.5">
                    {t('inputLabel', lang)} {metricLabel}:
                  </label>
                  <ArtistSearch
                    value={answer}
                    onChange={setAnswer}
                    onSelect={handleSelectFromSearch}
                    placeholder={t('inputPlaceholder', lang)}
                    disabled={loading}
                    onInputFocus={() => setInputFocused(true)}
                    onInputBlur={() => setInputFocused(false)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-black py-3 rounded-lg font-semibold hover:bg-brand-light transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('submitting', lang)}
                    </span>
                  ) : (
                    t('submit', lang)
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
