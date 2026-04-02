'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import GameScreen from '@/components/GameScreen'
import RoundFeedback from '@/components/RoundFeedback'
import ConfirmModal from '@/components/ConfirmModal'
import type { Artist, MetricMode, GameResult } from '@/types'
import { calculateScore } from '@/lib/metrics'
import { detectLang, t, type Lang } from '@/lib/i18n'

type ChallengeData = {
  id: string
  questions: Artist[]
  metric: MetricMode
  creatorName: string
  creatorScore: number
  results: { name: string; score: number }[]
}

export default function ChallengePage() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params?.id as string

  const [challenge, setChallenge] = useState<ChallengeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentRound, setCurrentRound] = useState(1)
  const [results, setResults] = useState<GameResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [lang] = useState<Lang>(() => detectLang())
  const [feedback, setFeedback] = useState<GameResult | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<Artist | null>(null)

  useEffect(() => {
    if (!challengeId) return
    fetch(`/api/challenge/${challengeId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => setChallenge(data))
      .catch(() => setError(lang === 'ja' ? 'チャレンジが見つかりません' : 'Challenge not found'))
      .finally(() => setLoading(false))
  }, [challengeId, lang])

  const totalRounds = challenge?.questions.length ?? 5

  const processAnswer = (answerArtist: Artist) => {
    if (!challenge) return
    const themeArtist = challenge.questions[currentRound - 1]

    if (answerArtist.id === themeArtist.id) {
      alert(t('sameArtist', lang))
      return
    }

    const metric = challenge.metric
    const themeVal = themeArtist.followers ?? 0
    const answerVal = answerArtist.followers ?? 0
    const diff = calculateScore(themeVal, answerVal)

    const result: GameResult = { theme: themeArtist.name, themeArtist, answer: answerArtist.name, answerArtist, diff, metric }
    const newResults = [...results, result]
    const newScore = totalScore + diff
    setResults(newResults)
    setTotalScore(newScore)

    setFeedback(result)
    setPendingAdvance(true)
  }

  const handleAnswer = async (artistName: string, artistId?: string) => {
    if (!artistName.trim() || !challenge) return

    const url = artistId
      ? `/api/popularity?id=${encodeURIComponent(artistId)}`
      : `/api/popularity?artist=${encodeURIComponent(artistName)}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || !data.id) {
      alert(t('artistNotFound', lang))
      return
    }

    const answerArtist: Artist = {
      id: data.id, name: data.name, popularity: data.popularity,
      followers: data.followers, genres: data.genres, imageUrl: data.imageUrl,
    }

    if (!artistId && data.name.toLowerCase() !== artistName.toLowerCase()) {
      setPendingConfirm(answerArtist)
      return
    }

    processAnswer(answerArtist)
  }

  const handleDismissFeedback = () => {
    setFeedback(null)
    if (pendingAdvance) {
      setPendingAdvance(false)
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1)
      } else {
        setFinished(true)
      }
    }
  }

  const handleSubmitResult = async () => {
    if (!playerName.trim() || !challengeId) return
    try {
      await fetch(`/api/challenge/${challengeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score: totalScore }),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand rounded-full border-t-transparent" />
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error || 'Challenge not found'}</p>
          <button onClick={() => router.push('/')} className="bg-brand text-black py-2 px-6 rounded-lg font-display font-semibold">
            {t('backToTop', lang)}
          </button>
        </div>
      </main>
    )
  }

  if (!finished) {
    return (
      <>
        <div className="bg-zinc-900 text-center py-2 text-sm text-zinc-400">
          {t('challengeTitle', lang)} — {challenge.creatorName}: {challenge.creatorScore}
        </div>
        <GameScreen
          currentRound={currentRound}
          totalRounds={totalRounds}
          themeArtist={challenge.questions[currentRound - 1]}
          onSubmitAnswer={handleAnswer}
          metric={challenge.metric}
          lang={lang}
        />
        <RoundFeedback result={feedback} onDismiss={handleDismissFeedback} lang={lang} />
        <ConfirmModal
          artist={pendingConfirm}
          onConfirm={() => {
            const artist = pendingConfirm
            setPendingConfirm(null)
            if (artist) processAnswer(artist)
          }}
          onCancel={() => setPendingConfirm(null)}
          lang={lang}
        />
      </>
    )
  }

  const won = totalScore > challenge.creatorScore

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="text-center animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-brand text-2xl font-bold mb-2">{t('challengeTitle', lang)}</h1>
          <p className={`text-4xl font-black ${won ? 'text-green-400' : 'text-red-400'}`}>
            {won ? (lang === 'ja' ? 'WIN!' : 'YOU WIN!') : (lang === 'ja' ? 'LOSE...' : 'YOU LOSE...')}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 p-4 rounded-xl text-center">
            <p className="text-xs text-zinc-500 mb-1">{challenge.creatorName}</p>
            <p className="text-2xl font-bold">{challenge.creatorScore}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl text-center border border-brand/30">
            <p className="text-xs text-zinc-500 mb-1">{t('yourScore', lang)}</p>
            <p className="text-2xl font-bold">{Math.round(totalScore)}</p>
          </div>
        </div>

        {!submitted ? (
          <div className="bg-zinc-900 p-4 rounded-xl space-y-3 animate-[fadeInUp_0.5s_ease-out]">
            <h2 className="text-brand font-bold">{t('registerRanking', lang)}</h2>
            <input
              type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder={t('nameInput', lang)}
              className="w-full p-2.5 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-brand"
            />
            <button onClick={handleSubmitResult} className="w-full bg-brand text-black py-2.5 rounded-lg font-semibold hover:bg-brand-light">
              {t('register', lang)}
            </button>
          </div>
        ) : (
          <p className="text-green-400 text-center font-semibold">{t('registered', lang)}</p>
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
                <div>
                  <span className="text-zinc-500">R{i + 1}</span>
                  <span className="ml-2 font-semibold">{r.themeArtist.nameJa || r.theme}</span>
                </div>
                <span className={`font-mono font-bold ${r.diff >= 90 ? 'text-brand' : r.diff < 40 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {r.diff}
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                → {r.answer}
              </div>
            </div>
          ))}
        </div>

        {/* Past challengers */}
        {challenge.results.length > 0 && (
          <div>
            <h2 className="text-brand font-bold mb-2">{lang === 'ja' ? '挑戦者一覧' : 'Challengers'}</h2>
            <div className="space-y-1">
              {[...challenge.results].sort((a, b) => b.score - a.score).map((r, i) => (
                <div key={i} className="bg-zinc-900 p-2 rounded-lg flex justify-between text-sm">
                  <span><span className="text-brand mr-2">{i + 1}</span>{r.name}</span>
                  <span className="text-zinc-400 font-mono">{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push('/')} className="flex-1 bg-brand text-black py-3 rounded-lg font-display font-semibold hover:bg-brand-light">
            {t('backToTop', lang)}
          </button>
        </div>
      </div>
    </main>
  )
}
