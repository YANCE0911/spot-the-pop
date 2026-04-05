'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import MuteToggle from '@/components/MuteToggle'
import ScoreRank from '@/components/ScoreRank'
import ShareSection from '@/components/ShareSection'
import { saveRanking, getPlayerRank, logArtistPlay } from '@/lib/ranking'
import { getPlayerId } from '@/lib/playerId'
import { detectLang, t, type Lang } from '@/lib/i18n'
import { playTick, playGo, playReaction } from '@/lib/sound'
import type { Difficulty } from '@/types'

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
const PROGRESS_KEY = 'soundiq_timeline_progress'
const SEEN_IDS_KEY = 'soundiq_timeline_seen'

// ISO week helper (matches buildWeeklyPacks.ts)
function getISOWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: date.getUTCFullYear(), week }
}

function getWeekKey(): string {
  const { year, week } = getISOWeek(new Date())
  return `${year}-${String(week).padStart(2, '0')}`
}

// Load seen track IDs from localStorage, reset if week changed
function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY)
    if (!raw) return new Set()
    const data = JSON.parse(raw)
    if (data.week !== getWeekKey()) return new Set() // new week, reset
    return new Set<string>(data.ids ?? [])
  } catch { return new Set() }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_IDS_KEY, JSON.stringify({ week: getWeekKey(), ids: [...ids] }))
}

// Fetch questions: try static pack first (hard mode only), fallback to API
async function fetchQuestions(count: number, region: 'jp' | 'global', difficulty: Difficulty = 'hard'): Promise<TrackQuestion[]> {
  const weekKey = getWeekKey()
  const seen = loadSeenIds()

  // Static packs are built with hard thresholds, so only use them for hard mode
  if (difficulty === 'hard') {
    try {
      const res = await fetch(`/packs/${region}/week-${weekKey}.json`)
      if (res.ok) {
        const pack = await res.json()
        const all: TrackQuestion[] = [...(pack.main ?? []), ...(pack.extra ?? [])]

        const unseen = all.filter(q => !seen.has(`${q.artistName}::${q.trackName}`))
        const pool = unseen.length >= count ? unseen : all

        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count)

        for (const q of shuffled) seen.add(`${q.artistName}::${q.trackName}`)
        saveSeenIds(seen)

        if (shuffled.length >= count) return shuffled
      }
    } catch { /* fall through to API */ }
  }

  // API fallback (supports difficulty parameter)
  const locale = region === 'jp' ? 'ja' : 'en'
  const res = await fetch(`/api/year/tracks?count=${count}&locale=${locale}&difficulty=${difficulty}`)
  const data = await res.json()
  return data.questions ?? []
}

// Artist-specific fetch
async function fetchArtistQuestions(artistId: string, count: number): Promise<TrackQuestion[]> {
  const res = await fetch(`/api/year/tracks?count=${count}&artist=${artistId}`)
  const data = await res.json()
  return data.questions ?? []
}

// Base score: smooth power curve, scaled by difficulty
// NORMAL: 10 × (1 − d/11)^1.13 (max 10pt/question, no time bonus, 100pt total)
// HARD:   7.5 × (1 − d/11)^1.13 (max 7.5pt + time bonus max 2.5 = 10pt/question, 100pt total)
function calculateBaseScore(guessed: number, actual: number, difficulty: Difficulty = 'hard'): number {
  const diff = Math.abs(guessed - actual)
  if (diff >= 11) return 0
  const maxBase = difficulty === 'easy' ? 10 : 7.5
  return Math.round(maxBase * Math.pow(1 - diff / 11, 1.13) * 10) / 10
}

// Time bonus: NORMAL = none, HARD = original 5-second steps (2.5/1.5/0.5)
function calculateTimeBonus(elapsedSeconds: number, difficulty: Difficulty = 'hard'): number {
  if (difficulty === 'easy') return 0
  if (elapsedSeconds <= 5) return 2.5
  if (elapsedSeconds <= 10) return 1.5
  if (elapsedSeconds <= 15) return 0.5
  return 0
}

// 5-tier reactions for TIMELINE
// NORMAL: 10-point base scale, HARD: 7.5-point base scale (unchanged from original)
function getReaction(baseScore: number, difficulty: Difficulty = 'hard'): { label: string; color: string } {
  if (difficulty === 'easy') {
    if (baseScore >= 10) return { label: 'PERFECT!!!', color: 'text-pink-400' }
    if (baseScore >= 8.0) return { label: 'GREAT!!', color: 'text-orange-400' }
    if (baseScore >= 5.3) return { label: 'GOOD!', color: 'text-yellow-400' }
    if (baseScore >= 2.7) return { label: 'SO SO', color: 'text-emerald-400' }
    return { label: 'MISS...', color: 'text-blue-400' }
  }
  // HARD: original thresholds
  if (baseScore >= 7.5) return { label: 'PERFECT!!!', color: 'text-pink-400' }
  if (baseScore >= 6.0) return { label: 'GREAT!!', color: 'text-orange-400' }
  if (baseScore >= 4.0) return { label: 'GOOD!', color: 'text-yellow-400' }
  if (baseScore >= 2.0) return { label: 'SO SO', color: 'text-emerald-400' }
  return { label: 'MISS...', color: 'text-blue-400' }
}

export default function YearGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <YearGame />
    </Suspense>
  )
}

function YearGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [lang] = useState<Lang>(() => detectLang())
  const [countdown, setCountdown] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameRegion] = useState<'jp' | 'global'>('jp')
  const [gameDifficulty] = useState<Difficulty>(() => {
    return searchParams?.get('difficulty') === 'easy' ? 'easy' : 'hard'
  })
  const [artistId] = useState<string | null>(() => searchParams?.get('artist') ?? null)
  const [artistName, setArtistName] = useState<string | null>(null)

  // Elapsed time tracking (no hard limit)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(0)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Always start fresh on load/reload
    localStorage.removeItem('yearGameResults')
    localStorage.removeItem(PROGRESS_KEY)

    const loadQuestions = artistId
      ? fetchArtistQuestions(artistId, 10)
      : fetchQuestions(10, gameRegion, gameDifficulty)

    loadQuestions
      .then(async (questions) => {
        if (questions.length > 0) {
          // Preload album images to prevent flicker
          await Promise.all(
            questions.filter(q => q.albumImageUrl).map(q =>
              new Promise<void>(resolve => {
                const img = new Image()
                img.onload = () => resolve()
                img.onerror = () => resolve()
                img.src = q.albumImageUrl!
              })
            )
          )
          setQuestions(questions)
          if (artistId) setArtistName(questions[0]?.artistName ?? null)
          if (gameDifficulty === 'hard' && !artistId) {
            setCountdown(3)
          } else {
            // NORMAL or artist mode: skip countdown, start immediately
            setGameStarted(true)
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      playGo()
      setGameStarted(true)
      setCountdown(null)
      return
    }
    playTick()
    const timer = setTimeout(() => setCountdown(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const currentQ = questions[currentRound]

  // Start elapsed timer when question is shown
  useEffect(() => {
    if (currentQ && !feedback && !loading && questions.length > 0 && gameStarted) {
      startTimeRef.current = Date.now()
      setElapsed(0)

      elapsedTimerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 100)
    }

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    }
  }, [currentRound, currentQ, feedback, loading, questions.length, gameStarted])

  const handleSubmit = () => {
    const year = parseInt(guessYear)
    if (!year || year < 1960 || year > new Date().getFullYear() || !currentQ) return

    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)

    const finalElapsed = (Date.now() - startTimeRef.current) / 1000
    const baseScore = calculateBaseScore(year, currentQ.releaseYear, gameDifficulty)
    const timeBonus = baseScore > 0 ? calculateTimeBonus(finalElapsed, gameDifficulty) : 0
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

    // Save progress to localStorage
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      gameRegion,
      questions,
      currentRound: currentRound,
      totalScore: totalScore + score,
      totalBaseScore: totalBaseScore + baseScore,
      totalTimeBonus: totalTimeBonus + timeBonus,
      results: [...results, result],
    }))

    // Play reaction sound (thresholds match getReaction)
    const r = getReaction(baseScore, gameDifficulty)
    if (r.label.startsWith('PERFECT')) playReaction('perfect')
    else if (r.label.startsWith('GREAT')) playReaction('great')
    else if (r.label.startsWith('GOOD')) playReaction('good')
    else if (r.label.startsWith('SO')) playReaction('soso')
    else playReaction('miss')
  }

  const handleNext = () => {
    setFeedback(null)
    setGuessYear('')
    if (currentRound + 1 < TOTAL_ROUNDS && currentRound + 1 < questions.length) {
      setCurrentRound(prev => prev + 1)
    } else {
      localStorage.removeItem(PROGRESS_KEY)
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
  const currentBonus = elapsed <= BONUS_ZONE ? calculateTimeBonus(elapsed, gameDifficulty) : 0
  const showSpeedBonus = gameDifficulty === 'hard'

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-accent rounded-full border-t-transparent mx-auto" />
          <p className="text-zinc-400 text-sm">{lang === 'ja' ? '曲を読み込み中...' : 'Loading tracks...'}</p>
        </div>
      </main>
    )
  }

  if (countdown !== null) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent text-sm font-bold tracking-widest mb-4">TIMELINE</p>
          <p
            key={countdown}
            className="text-8xl font-black text-accent animate-[popIn_0.4s_ease-out]"
          >
            {countdown > 0 ? countdown : 'GO!'}
          </p>
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
        lang={lang}
        region={gameRegion}
        difficulty={gameDifficulty}
        artistId={artistId}
        artistName={artistName}
      />
    )
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{lang === 'ja' ? '曲の読み込みに失敗しました' : 'Could not load tracks.'}</p>
          <p className="text-zinc-400 text-sm mt-2">{lang === 'ja' ? 'Spotify APIの制限中かもしれません。数分後にお試しください。' : 'Spotify API rate limit may be active. Try again in a few minutes.'}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => window.location.reload()} className="bg-zinc-700 text-white py-2 px-6 rounded-lg font-semibold">
              {lang === 'ja' ? 'リトライ' : 'Retry'}
            </button>
            <button onClick={() => router.push('/')} className="bg-brand text-black py-2 px-6 rounded-lg font-semibold">
              {lang === 'ja' ? '戻る' : 'Back'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-4 font-sans">
      <div className="max-w-lg mx-auto space-y-3">
        <header>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white text-lg transition-colors">←</button>
              <Logo />
            </div>
            <div className="flex items-center gap-3">
              <MuteToggle />
              <div className="text-right">
                <span className="text-xs text-zinc-400">ROUND</span>
                <div className="text-xl font-bold">{currentRound + 1}/{Math.min(TOTAL_ROUNDS, questions.length)}</div>
              </div>
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

          {currentQ && !feedback && gameStarted && showSpeedBonus && (
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
                <span className="text-zinc-500 font-bold">SPEED BONUS +0.0</span>
              )}
            </div>
          )}
        </header>

        {currentQ && !feedback && gameStarted && (
            <div className="space-y-3">
              {/* Album art + song info — centered, large */}
              <div className="bg-zinc-900 p-4 rounded-xl text-center space-y-2">
                {currentQ.albumImageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQ.albumImageUrl}
                      alt={currentQ.singleName}
                      className="w-36 h-36 rounded-xl object-cover shadow-lg"
                    />
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg">{currentQ.singleName}</p>
                  <p className="text-zinc-400 text-sm">{currentQ.artistName}</p>
                </div>
              </div>

              {/* Year display + Numpad */}
              <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
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
                        ? 'bg-accent text-white active:brightness-110 animate-[pulse-glow_1.5s_ease-in-out_infinite]'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {feedback && (
            <div className="bg-zinc-900 p-5 rounded-xl space-y-4 text-center animate-[fadeIn_0.15s_ease-out]">
              <p className={`text-4xl font-display font-black ${getReaction(feedback.baseScore, gameDifficulty).color}`}>
                {getReaction(feedback.baseScore, gameDifficulty).label}
              </p>
              <div className="space-y-1">
                <p className="text-zinc-400">
                  {lang === 'ja' ? 'あなたの回答' : 'Your guess'}: <span className="text-white font-bold">{feedback.guessedYear}</span>
                </p>
                <p className="text-zinc-400">
                  {lang === 'ja' ? '正解' : 'Answer'}: <span className="text-accent font-bold text-2xl">{feedback.actualYear}</span>
                </p>
                <p className="text-zinc-500 text-xs">{feedback.singleName}</p>
                {feedback.guessedYear !== feedback.actualYear && (
                  <p className="text-zinc-500 text-sm">
                    {Math.abs(feedback.guessedYear - feedback.actualYear)}{lang === 'ja' ? '年ズレ' : (Math.abs(feedback.guessedYear - feedback.actualYear) === 1 ? ' year off' : ' years off')}
                  </p>
                )}
              </div>
              <div className="flex items-baseline justify-center">
                <span className={`text-4xl font-black font-mono ${
                  getReaction(feedback.baseScore, gameDifficulty).label.startsWith('PERFECT') || getReaction(feedback.baseScore, gameDifficulty).label.startsWith('GREAT')
                    ? 'text-accent' : feedback.baseScore < 1 ? 'text-red-400' : 'text-zinc-300'
                }`}>
                  +{feedback.baseScore.toFixed(1)}
                </span>
                {showSpeedBonus && feedback.timeBonus > 0 && (
                  <span className="text-sm font-bold font-mono text-violet-300 ml-1.5">+{feedback.timeBonus.toFixed(1)}</span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
              >
                {currentRound + 1 < TOTAL_ROUNDS ? (lang === 'ja' ? '次へ' : 'Next') : (lang === 'ja' ? '結果を見る' : 'See Results')}
              </button>
            </div>
          )}

        <p className="text-center text-zinc-500 text-xs">
          {lang === 'ja' ? '※Spotifyの登録情報に基づく発売年です' : 'Release years based on Spotify data'}
        </p>
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
  lang,
  region,
  difficulty,
  artistId,
  artistName,
}: {
  displayScore: number
  displayBase: number
  displayBonus: number
  results: RoundResult[]
  router: ReturnType<typeof useRouter>
  lang: Lang
  region: 'jp' | 'global'
  difficulty: Difficulty
  artistId?: string | null
  artistName?: string | null
}) {
  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [autoSaveResult, setAutoSaveResult] = useState<{ updated: boolean; bestScore: number } | null>(null)
  const [playerRank, setPlayerRank] = useState<number | null>(null)
  const [artistBest, setArtistBest] = useState<number | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)

  // Artist mode: self-best (localStorage) + silent play log (Firestore)
  useEffect(() => {
    if (!artistId || !artistName) return
    // Self-best
    const key = `soundiq_artist_best_${artistId}`
    const prev = parseFloat(localStorage.getItem(key) ?? '0')
    setArtistBest(prev > 0 ? prev : null)
    if (displayScore > prev) {
      localStorage.setItem(key, String(displayScore))
      setIsNewBest(true)
    }
    // Silent play log
    logArtistPlay(artistId, artistName, displayScore)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save for returning users (skip in artist mode)
  useEffect(() => {
    if (artistId) return
    const savedName = localStorage.getItem('soundiq_name')
    if (!savedName) return
    setPlayerName(savedName)
    const pid = getPlayerId()
    saveRanking(savedName, displayScore, 'classic', 'year', undefined, 'timeline', pid, region, difficulty)
      .then(result => {
        setAutoSaveResult(result)
        setSubmitted(true)
        return getPlayerRank(pid, 'timeline', region, difficulty)
      })
      .then(rankResult => {
        if (rankResult) setPlayerRank(rankResult.rank)
      })
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegister = async () => {
    if (!playerName.trim() || submitting || submitted) return
    setSubmitting(true)
    try {
      const pid = getPlayerId()
      const result = await saveRanking(playerName, displayScore, 'classic', 'year', undefined, 'timeline', pid, region, difficulty)
      localStorage.setItem('soundiq_name', playerName.trim())
      setAutoSaveResult(result)
      setSubmitted(true)
      const rankResult = await getPlayerRank(pid, 'timeline', region, difficulty)
      if (rankResult) setPlayerRank(rankResult.rank)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4 font-sans">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <header className="animate-[fadeInUp_0.4s_ease-out]">
          <div className="mb-4"><Logo size="sm" /></div>
          <h2 className="text-accent text-lg font-bold mb-2 text-center">
            {artistName ? `TIMELINE - ${artistName}` : 'TIMELINE'}{' '}
            {!artistName && <span className="text-zinc-500 text-sm">{difficulty === 'easy' ? 'NORMAL' : 'HARD'}</span>}{' '}
            {t('results', lang)}
          </h2>
          <div className="text-center">
            <p className="text-5xl font-black animate-[countUp_0.6s_ease-out_0.2s_both]">
              {displayScore.toFixed(2)}
              <span className="text-zinc-400 text-lg ml-1">/100</span>
            </p>
            {difficulty === 'hard' && (
              <div className="flex justify-center gap-4 mt-2 text-sm">
                <span className="text-zinc-400">Base: <span className="text-white font-bold">{displayBase.toFixed(1)}</span></span>
                <span className="text-zinc-400">Speed: <span className="text-violet-300 font-bold">+{displayBonus.toFixed(1)}</span></span>
              </div>
            )}
          </div>
        </header>

        <ScoreRank score={displayScore} lang={lang} />

        {/* Artist mode: self-best display */}
        {artistId && (
          <div className="text-center space-y-1">
            {isNewBest ? (
              <p className="text-accent font-bold text-lg animate-[fadeInUp_0.4s_ease-out]">
                {lang === 'ja' ? '自己ベスト更新！' : 'New Personal Best!'}
              </p>
            ) : artistBest !== null ? (
              <p className="text-zinc-400 text-sm">
                {lang === 'ja' ? '自己ベスト' : 'Personal Best'}: <span className="text-white font-bold">{artistBest.toFixed(2)}</span>
              </p>
            ) : null}
          </div>
        )}

        {/* Name registration — hidden in artist mode (share only) */}
        {!artistId && (
          <>
            {!submitted ? (
              <div className="border border-accent/30 bg-zinc-900 p-4 rounded-xl space-y-3 animate-[fadeInUp_0.5s_ease-out]">
                <h2 className="text-accent font-bold">{t('registerRanking', lang)}</h2>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder={t('nameInput', lang)}
                  className="w-full p-2.5 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold hover:brightness-110"
                >
                  {submitting ? (lang === 'ja' ? '登録中...' : 'Submitting...') : t('register', lang)}
                </button>
              </div>
            ) : autoSaveResult?.updated ? (
              <div className="text-center space-y-1">
                <p className="text-accent font-bold text-lg">{t('newBest', lang)}</p>
                <p className="text-zinc-400 text-sm">{playerName}</p>
                {playerRank && (
                  <p className="text-zinc-500 text-xs">{lang === 'ja' ? `現在 ${playerRank}位` : `Rank #${playerRank}`}</p>
                )}
              </div>
            ) : autoSaveResult && !autoSaveResult.updated && autoSaveResult.bestScore > displayScore ? (
              <div className="text-center space-y-1">
                <p className="text-zinc-400 text-sm">
                  {t('bestLabel', lang)}: {autoSaveResult.bestScore.toFixed(2)}
                </p>
                <p className="text-zinc-500 text-xs">{playerName}</p>
                {playerRank && (
                  <p className="text-zinc-500 text-xs">{lang === 'ja' ? `現在 ${playerRank}位` : `Rank #${playerRank}`}</p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-accent font-semibold">{t('registered', lang)}</p>
                <p className="text-zinc-400 text-sm">{playerName}</p>
                {playerRank && (
                  <p className="text-zinc-500 text-xs">{lang === 'ja' ? `現在 ${playerRank}位` : `Rank #${playerRank}`}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Play Again */}
        <button
          onClick={() => {
            localStorage.removeItem('yearGameResults')
            window.location.href = artistId
              ? `/year?artist=${artistId}`
              : `/year?difficulty=${difficulty}`
          }}
          className="w-full bg-accent text-white py-3 rounded-lg font-display font-semibold hover:brightness-110 transition-all"
        >
          {t('playAgain', lang)}
        </button>

        {/* X / Copy */}
        <div className="grid grid-cols-2 gap-2">
          <ShareSection score={displayScore} mode="timeline" lang={lang} artistName={artistName ?? undefined} />
        </div>

        {/* Round results */}
        <div className="space-y-2">
          <h2 className="text-accent font-bold">{t('roundResults', lang)}</h2>
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
                    <span className={`font-mono font-bold text-sm ${r.baseScore >= 6.0 ? 'text-accent' : r.baseScore < 1 ? 'text-red-400' : 'text-zinc-300'}`}>
                      +{r.baseScore.toFixed(1)}
                    </span>
                    {difficulty === 'hard' && r.timeBonus > 0 && (
                      <span className="text-violet-300 font-mono text-xs font-bold">+{r.timeBonus.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-500 text-xs">
          {lang === 'ja' ? '※Spotifyの登録情報に基づく発売年です' : 'Release years based on Spotify data'}
        </p>

        {/* Top */}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-zinc-800 text-white py-3 rounded-lg font-sans font-semibold hover:bg-zinc-700 transition-all text-sm"
        >
          {t('top', lang)}
        </button>

        {/* Support link */}
        <div className="text-center pt-2">
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
