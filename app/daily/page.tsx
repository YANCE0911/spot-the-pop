'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GameScreen from '@/components/GameScreen'
import RoundFeedback from '@/components/RoundFeedback'
import ConfirmModal from '@/components/ConfirmModal'
import type { Artist, MetricMode, GameResult } from '@/types'
import { calculateScore } from '@/lib/metrics'
import { detectLang, type Lang } from '@/lib/i18n'

function DailyContent() {
  const router = useRouter()
  const metric: MetricMode = 'followers'

  const [currentRound, setCurrentRound] = useState(1)
  const [questions, setQuestions] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<GameResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [lang] = useState<Lang>(() => detectLang())
  const [feedback, setFeedback] = useState<GameResult | null>(null)
  const [pendingFinish, setPendingFinish] = useState<{ results: GameResult[]; score: number } | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<Artist | null>(null)

  useEffect(() => {
    fetch('/api/daily/questions')
      .then(r => r.json())
      .then(data => {
        if (data.questions) setQuestions(data.questions)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const finishGame = (finalResults: GameResult[], finalScore: number) => {
    localStorage.setItem('gameResults', JSON.stringify({
      score: finalScore,
      results: finalResults,
      mode: 'daily',
      metric,
    }))
    router.push('/daily/results')
  }

  const processAnswer = (answerArtist: Artist) => {
    const themeArtist = questions[currentRound - 1]

    if (answerArtist.id === themeArtist.id) {
      alert(lang === 'ja' ? 'お題と同じアーティストは回答できません！' : 'Cannot answer with the same artist!')
      return
    }

    const themeVal = themeArtist.followers ?? 0
    const answerVal = answerArtist.followers ?? 0
    const diff = calculateScore(themeVal, answerVal)

    const result: GameResult = { theme: themeArtist.name, themeArtist, answer: answerArtist.name, answerArtist, diff, metric }
    const newResults = [...results, result]
    const newScore = totalScore + diff
    setResults(newResults)
    setTotalScore(newScore)

    setFeedback(result)
    if (currentRound >= 5) {
      setPendingFinish({ results: newResults, score: newScore })
    }
  }

  const handleAnswer = async (artistName: string, artistId?: string) => {
    if (!artistName.trim() || !questions[currentRound - 1]) return

    const url = artistId
      ? `/api/popularity?id=${encodeURIComponent(artistId)}`
      : `/api/popularity?artist=${encodeURIComponent(artistName)}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || !data.id) {
      alert(lang === 'ja' ? 'アーティストが見つかりません' : 'Artist not found.')
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
    if (pendingFinish) {
      finishGame(pendingFinish.results, pendingFinish.score)
      setPendingFinish(null)
    } else {
      setCurrentRound(prev => prev + 1)
    }
  }

  const handleTimeout = () => {
    if (!questions[currentRound - 1]) return
    const themeArtist = questions[currentRound - 1]
    const result: GameResult = {
      theme: themeArtist.name, themeArtist,
      answer: '(timeout)', answerArtist: { id: '', name: '(timeout)', popularity: 0 },
      diff: 0, metric,
    }
    const newResults = [...results, result]
    const newScore = totalScore + 0
    setResults(newResults)
    setTotalScore(newScore)

    if (currentRound < 5) {
      setCurrentRound(prev => prev + 1)
    } else {
      finishGame(newResults, newScore)
    }
  }

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand rounded-full border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <GameScreen
        key={questions[0]?.id}
        currentRound={currentRound}
        totalRounds={5}
        themeArtist={questions[currentRound - 1]}
        onSubmitAnswer={handleAnswer}
        metric={metric}
        timer={60}
        onTimeout={handleTimeout}
        lang={lang}
        totalScore={totalScore}
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

export default function DailyPage() {
  return <DailyContent />
}
