'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveRanking } from '@/lib/ranking'
import { getPlayerId } from '@/lib/playerId'
import ShareButton from '@/components/ShareButton'
import ScoreRank from '@/components/ScoreRank'
import type { GameResult } from '@/types'
import { formatMetricValue } from '@/lib/metrics'
import { detectLang, t, type Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'

export default function Results() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<GameResult[]>([])
  const [metric, setMetric] = useState('popularity')
  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [challengeUrl, setChallengeUrl] = useState<string>()
  const [lang] = useState<Lang>(() => detectLang())

  useEffect(() => {
    const saved = localStorage.getItem('gameResults')
    if (!saved) { router.push('/'); return }
    try {
      const data = JSON.parse(saved)
      setScore(data.score)
      setResults(data.results ?? [])
      setMetric(data.metric ?? 'popularity')

      if (localStorage.getItem('rankingSubmitted') === 'true') {
        setSubmitted(true)
      }
    } catch {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async () => {
    if (!playerName.trim() || submitting || submitted) return
    setSubmitting(true)
    try {
      // Save raw decimal score (2dp) for ranking differentiation
      const displayScore = Math.round(score * 100) / 100
      const pid = getPlayerId()
      await saveRanking(playerName, displayScore, undefined, undefined, undefined, 'versus', pid)
      localStorage.setItem('rankingSubmitted', 'true')
      setSubmitted(true)

      const questions = results.map(r => r.themeArtist)
      const res = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, metric, creatorName: playerName, creatorScore: displayScore }),
      })
      const data = await res.json()
      if (data.url) setChallengeUrl(data.url)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const displayScore = Math.round(score * 100) / 100

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="animate-[fadeInUp_0.4s_ease-out]">
          <div className="mb-4"><Logo size="sm" /></div>
          <h2 className="text-brand text-lg font-bold mb-2 text-center">{t('results', lang)}</h2>
          <p className="text-5xl font-black animate-[countUp_0.6s_ease-out_0.2s_both]">
            {displayScore.toFixed(2)}
          </p>
          <p className="text-zinc-500 text-sm mt-1">{lang === 'ja' ? '/ 100' : '/ 100'}</p>
        </header>

        <ScoreRank score={displayScore} lang={lang} />

        <ShareButton score={score} mode="Classic" metric={metric} results={results} challengeUrl={challengeUrl} lang={lang} />

        {!submitted ? (
          <div className="bg-zinc-900 p-4 rounded-xl space-y-3 animate-[fadeInUp_0.5s_ease-out]">
            <h2 className="text-brand font-bold">{t('registerRanking', lang)}</h2>
            <input
              type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder={t('nameInput', lang)}
              className="w-full p-2.5 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-brand"
            />
            <button onClick={handleSubmit} className="w-full bg-brand text-black py-2.5 rounded-lg font-semibold hover:bg-brand-light">
              {t('register', lang)}
            </button>
          </div>
        ) : (
          <p className="text-brand text-center font-semibold">{t('registered', lang)}</p>
        )}

        {/* Round results */}
        <div className="space-y-2">
          <h2 className="text-brand font-bold">{t('roundResults', lang)}</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className="bg-zinc-900 p-3 rounded-lg animate-[fadeInLeft_0.3s_ease-out]"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex justify-between text-sm">
                <div className="min-w-0">
                  <span className="text-zinc-500">R{i + 1}</span>
                  <span className="ml-2 font-semibold">{r.themeArtist.nameJa || r.theme}</span>
                  <span className="text-zinc-600 ml-1">
                    ({formatMetricValue(
                      metric === 'followers' ? (r.themeArtist.followers ?? 0) : r.themeArtist.popularity,
                      r.metric
                    )})
                  </span>
                </div>
                <span className={`font-mono font-bold flex-shrink-0 ${r.diff >= 17 ? 'text-brand' : r.diff < 6 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {r.diff.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                → {r.answer} ({formatMetricValue(
                  metric === 'followers' ? (r.answerArtist.followers ?? 0) : r.answerArtist.popularity,
                  r.metric
                )})
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push('/game')} className="flex-1 bg-brand text-black py-3 rounded-lg font-semibold hover:bg-brand-light">
            Play Again
          </button>
          <button onClick={() => router.push('/')} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-semibold hover:bg-zinc-700">
            Top
          </button>
        </div>
      </div>
    </main>
  )
}
