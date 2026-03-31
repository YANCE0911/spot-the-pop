'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'
import ScoreRank from '@/components/ScoreRank'
import { saveRanking } from '@/lib/ranking'
import { getPlayerId } from '@/lib/playerId'

type TrackQuestion = {
  trackName: string
  singleName: string
  artistName: string
  artistNameJa?: string
  albumImageUrl?: string
  releaseYear: number
}

type RoundResult = {
  trackName: string
  singleName: string
  artistName: string
  artistNameJa?: string
  albumImageUrl?: string
  guessedYear: number
  actualYear: number
  baseScore: number
  timeBonus: number
  score: number
}

const TOTAL_ROUNDS = 10
const BONUS_ZONE = 15 // time bonus available in first 15 seconds

// Stepped decimal scoring by year difference (max 8.5 base + 1.5 bonus = 10/q × 10q = 100)
const YEAR_SCORE_TABLE: number[] = [
   8.5, // 0 years off = PERFECT
   7.0, // 1 year off
   5.5, // 2 years off
   4.0, // 3 years off
   2.5, // 4 years off
   1.0, // 5 years off
   0.5, // 6 years off
]
// 7+ years off = 0.0

function calculateBaseScore(guessed: number, actual: number): number {
  const diff = Math.abs(guessed - actual)
  if (diff >= YEAR_SCORE_TABLE.length) return 0
  return YEAR_SCORE_TABLE[diff]
}

// Time bonus: step-based, within first 15 seconds. No hard time limit.
function calculateTimeBonus(elapsedSeconds: number): number {
  if (elapsedSeconds <= 5) return 1.5
  if (elapsedSeconds <= 10) return 0.75
  if (elapsedSeconds <= 15) return 0.25
  return 0
}

function getReaction(baseScore: number): { label: string; color: string } | null {
  if (baseScore >= 8.5) return { label: 'PERFECT!!!', color: 'text-pink-400' }
  if (baseScore >= 7) return { label: 'GREAT!!', color: 'text-orange-400' }
  if (baseScore >= 5.5) return { label: 'GOOD!', color: 'text-yellow-400' }
  return null // 3+ years off: no label, just show score + year diff
}

export default function YearGame() {
  const router = useRouter()
  const [questions, setQuestions] = useState<TrackQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(0)
  const [guessYear, setGuessYear] = useState('')
  const [totalScore, setTotalScore] = useState(0)
  const [totalBaseScore, setTotalBaseScore] = useState(0)
  const [totalTimeBonus, setTotalTimeBonus] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [feedback, setFeedback] = useState<RoundResult | null>(null)
  const [finished, setFinished] = useState(false)

  // Elapsed time tracking (no hard limit)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(0)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/year/tracks?count=10')
      .then(r => r.json())
      .then(data => {
        if (data.questions?.length > 0) {
          setQuestions(data.questions)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const currentQ = questions[currentRound]

  // Start elapsed timer when question is shown
  useEffect(() => {
    if (currentQ && !feedback && !loading && questions.length > 0) {
      startTimeRef.current = Date.now()
      setElapsed(0)

      elapsedTimerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 100)
    }

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    }
  }, [currentRound, currentQ, feedback, loading, questions.length])

  const handleSubmit = () => {
    const year = parseInt(guessYear)
    if (!year || year < 1960 || year > 2026 || !currentQ) return

    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)

    const finalElapsed = (Date.now() - startTimeRef.current) / 1000
    const baseScore = calculateBaseScore(year, currentQ.releaseYear)
    const timeBonus = baseScore > 0 ? calculateTimeBonus(finalElapsed) : 0
    const score = baseScore + timeBonus

    const result: RoundResult = {
      trackName: currentQ.trackName,
      singleName: currentQ.singleName,
      artistName: currentQ.artistName,
      artistNameJa: currentQ.artistNameJa,
      albumImageUrl: currentQ.albumImageUrl,
      guessedYear: year,
      actualYear: currentQ.releaseYear,
      baseScore,
      timeBonus,
      score,
    }

    setResults(prev => [...prev, result])
    setTotalScore(prev => prev + score)
    setTotalBaseScore(prev => prev + baseScore)
    setTotalTimeBonus(prev => prev + timeBonus)
    setFeedback(result)
  }

  const handleNext = () => {
    setFeedback(null)
    setGuessYear('')
    if (currentRound + 1 < TOTAL_ROUNDS && currentRound + 1 < questions.length) {
      setCurrentRound(prev => prev + 1)
    } else {
      localStorage.setItem('yearGameResults', JSON.stringify({
        score: totalScore,
        baseScore: totalBaseScore,
        timeBonus: totalTimeBonus,
        results,
      }))
      setFinished(true)
    }
  }

  const handleNumpad = (digit: string) => {
    if (guessYear.length < 4) setGuessYear(prev => prev + digit)
  }
  const handleBackspace = () => {
    setGuessYear(prev => prev.slice(0, -1))
  }

  const bonusPercent = Math.max(0, (BONUS_ZONE - elapsed) / BONUS_ZONE) * 100
  const currentBonus = elapsed <= BONUS_ZONE ? calculateTimeBonus(elapsed) : 0

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-accent rounded-full border-t-transparent mx-auto" />
          <p className="text-zinc-500 text-sm">Loading tracks...</p>
        </div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Could not load tracks.</p>
          <p className="text-zinc-500 text-sm mt-2">Spotify API rate limit may be active. Try again in a few minutes.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => window.location.reload()} className="bg-zinc-700 text-white py-2 px-6 rounded-lg font-semibold">
              Retry
            </button>
            <button onClick={() => router.push('/')} className="bg-brand text-black py-2 px-6 rounded-lg font-semibold">
              Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (finished) {
    const displayScore = Math.round(totalScore * 100) / 100
    const displayBase = Math.round(totalBaseScore * 10) / 10
    const displayBonus = Math.round(totalTimeBonus * 10) / 10
    return (
      <TimelineResults
        displayScore={displayScore}
        displayBase={displayBase}
        displayBonus={displayBonus}
        results={results}
        router={router}
      />
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-4 font-sans">
      <div className="max-w-lg mx-auto space-y-3">
        <header>
          <div className="flex items-center justify-between mb-2">
            <Logo />
            <div className="text-right">
              <span className="text-xs text-zinc-400">ROUND</span>
              <div className="text-xl font-bold">{currentRound + 1}/{Math.min(TOTAL_ROUNDS, questions.length)}</div>
            </div>
          </div>

          {totalScore > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-accent font-semibold">TOTAL SCORE</span>
                <span className="text-zinc-400 font-mono">? / 100</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-accent/60 h-full rounded-full"
                  animate={{ width: `${Math.min(totalScore, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {currentQ && !feedback && (
            <div className="flex items-center justify-between text-xs h-5">
              {elapsed <= BONUS_ZONE ? (
                <>
                  <span className="text-violet-300 font-bold">SPEED BONUS +{currentBonus.toFixed(1)}</span>
                  <div className="w-24 bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-violet-300 h-full rounded-full"
                      animate={{ width: `${bonusPercent}%` }}
                      transition={{ duration: 0.1, ease: 'linear' }}
                    />
                  </div>
                </>
              ) : (
                <span className="text-zinc-600 font-bold">SPEED BONUS +0.0</span>
              )}
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {currentQ && !feedback && (
            <motion.div
              key={`q-${currentRound}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Album art + song info — centered, large */}
              <div className="bg-zinc-900 p-4 rounded-xl text-center space-y-2">
                {currentQ.albumImageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQ.albumImageUrl}
                      alt=""
                      className="w-36 h-36 rounded-xl object-cover shadow-lg"
                    />
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg">{currentQ.singleName}</p>
                  <p className="text-zinc-500 text-sm">{currentQ.artistName}</p>
                </div>
              </div>

              {/* Year display + Numpad */}
              <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
                {/* Preset buttons */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => { setGuessYear('19') }}
                    disabled={guessYear.length > 0}
                    className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${
                      guessYear.length === 0
                        ? 'bg-zinc-700 text-white active:bg-zinc-500'
                        : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    19XX
                  </button>
                  <button
                    onClick={() => { setGuessYear('20') }}
                    disabled={guessYear.length > 0}
                    className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${
                      guessYear.length === 0
                        ? 'bg-zinc-700 text-white active:bg-zinc-500'
                        : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    20XX
                  </button>
                </div>

                <div className="flex justify-center items-center gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold font-mono ${
                        guessYear[i] ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-600'
                      }`}
                    >
                      {guessYear[i] || '_'}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {['1','2','3','4','5','6','7','8','9'].map(d => (
                    <button
                      key={d}
                      onClick={() => handleNumpad(d)}
                      className="bg-zinc-800 text-white text-lg font-bold py-3 rounded-lg active:bg-zinc-600 transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={handleBackspace}
                    className="bg-zinc-800 text-zinc-400 text-base font-bold py-3 rounded-lg active:bg-zinc-600 transition-colors"
                  >
                    &#9003;
                  </button>
                  <button
                    onClick={() => handleNumpad('0')}
                    className="bg-zinc-800 text-white text-lg font-bold py-3 rounded-lg active:bg-zinc-600 transition-colors"
                  >
                    0
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={guessYear.length !== 4 || parseInt(guessYear) < 1960 || parseInt(guessYear) > 2026}
                    className={`text-sm font-bold py-3 rounded-lg transition-colors ${
                      guessYear.length === 4 && parseInt(guessYear) >= 1960 && parseInt(guessYear) <= 2026
                        ? 'bg-accent text-white active:brightness-110'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {feedback && (
            <motion.div
              key={`fb-${currentRound}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 p-5 rounded-xl space-y-4 text-center"
            >
              {getReaction(feedback.baseScore) && (
                <p className={`text-4xl font-display font-black ${getReaction(feedback.baseScore)!.color}`}>
                  {getReaction(feedback.baseScore)!.label}
                </p>
              )}
              <div className="space-y-1">
                <p className="text-zinc-400">
                  あなたの回答: <span className="text-white font-bold">{feedback.guessedYear}</span>
                </p>
                <p className="text-zinc-400">
                  正解: <span className="text-accent font-bold text-2xl">{feedback.actualYear}</span>
                </p>
                <p className="text-zinc-500 text-xs">{feedback.singleName}</p>
                {feedback.guessedYear !== feedback.actualYear && (
                  <p className="text-zinc-500 text-sm">
                    {Math.abs(feedback.guessedYear - feedback.actualYear)}年ずれ
                  </p>
                )}
              </div>
              <div className="flex items-baseline justify-center">
                <span className={`text-4xl font-black font-mono ${feedback.baseScore >= 6.5 ? 'text-accent' : feedback.baseScore < 1 ? 'text-red-400' : 'text-zinc-300'}`}>
                  +{feedback.baseScore.toFixed(1)}
                </span>
                {feedback.timeBonus > 0 && (
                  <span className="text-sm font-bold font-mono text-violet-300 ml-1.5">+{feedback.timeBonus.toFixed(1)}</span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
              >
                {currentRound + 1 < TOTAL_ROUNDS ? '次へ' : '結果を見る'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-zinc-700 text-xs">※Spotifyの登録情報に基づく発売年です</p>
      </div>
    </main>
  )
}

// --- Timeline Results Screen ---
function TimelineResults({
  displayScore,
  displayBase,
  displayBonus,
  results,
  router,
}: {
  displayScore: number
  displayBase: number
  displayBonus: number
  results: RoundResult[]
  router: ReturnType<typeof useRouter>
}) {
  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRegister = async () => {
    if (!playerName.trim() || submitting || submitted) return
    setSubmitting(true)
    try {
      const pid = getPlayerId()
      await saveRanking(playerName, displayScore, 'classic', 'year', undefined, 'timeline', pid)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share?score=${displayScore.toFixed(2)}&mode=timeline`
    : ''
  const shareText = `SOUND IQ - TIMELINE\nScore: ${displayScore.toFixed(2)}/100`

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tweetText = encodeURIComponent(shareText)
  const tweetUrl = encodeURIComponent(shareUrl)

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4 font-sans">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="animate-[fadeInUp_0.4s_ease-out]">
          <div className="mb-4"><Logo size="sm" /></div>
          <div className="text-center">
            <p className="text-5xl font-black mt-2">
              {displayScore.toFixed(2)}
              <span className="text-zinc-500 text-lg ml-1">/100</span>
            </p>
            <div className="flex justify-center gap-4 mt-2 text-sm">
              <span className="text-zinc-400">Base: <span className="text-white font-bold">{displayBase.toFixed(1)}</span></span>
              <span className="text-zinc-400">Speed: <span className="text-violet-300 font-bold">+{displayBonus.toFixed(1)}</span></span>
            </div>
          </div>
        </header>

        <ScoreRank score={displayScore} />

        {/* Share */}
        <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-black border border-zinc-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center"
          >
            X
          </a>
          <button
            onClick={handleShare}
            className="flex-1 bg-accent text-white py-3 px-4 rounded-xl font-bold hover:brightness-110 transition-all active:scale-[0.98]"
          >
            {copied ? 'コピーしました' : 'コピー'}
          </button>
        </div>

        {/* Name registration */}
        {!submitted ? (
          <div className="bg-zinc-900 p-4 rounded-xl space-y-3 animate-[fadeInUp_0.5s_ease-out]">
            <h2 className="text-accent font-bold">ランキングに登録</h2>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              className="w-full p-2.5 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleRegister}
              disabled={submitting}
              className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold hover:brightness-110"
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
          </div>
        ) : (
          <p className="text-accent text-center font-semibold">登録しました！</p>
        )}

        {/* Round results */}
        <div className="space-y-2">
          <h2 className="text-accent font-bold">ラウンド結果</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className="bg-zinc-900 p-3 rounded-lg animate-[fadeInLeft_0.3s_ease-out]"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <span className="text-zinc-500 text-sm">R{i + 1}</span>
                  <span className="ml-2 font-semibold text-sm">{r.singleName}</span>
                  <p className="text-xs text-zinc-500 truncate">{r.artistName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-zinc-500">{r.guessedYear} → {r.actualYear}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`font-mono font-bold text-sm ${r.baseScore >= 6.5 ? 'text-accent' : r.baseScore < 1 ? 'text-red-400' : 'text-zinc-300'}`}>
                      +{r.baseScore.toFixed(1)}
                    </span>
                    {r.timeBonus > 0 && (
                      <span className="text-violet-300 font-mono text-xs font-bold">+{r.timeBonus.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-xs">※Spotifyの登録情報に基づく発売年です</p>

        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="flex-1 bg-accent text-white py-3 rounded-lg font-semibold hover:brightness-110">
            もう一度プレイ
          </button>
          <button onClick={() => router.push('/')} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-semibold hover:bg-zinc-700">
            トップ
          </button>
        </div>
      </div>
    </main>
  )
}
