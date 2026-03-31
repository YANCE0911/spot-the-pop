'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import GameScreen from '@/components/GameScreen'
import RoundFeedback from '@/components/RoundFeedback'
import ConfirmModal from '@/components/ConfirmModal'
import type { Artist, MetricMode, GenreCategory, GameResult } from '@/types'
import { calculateScore } from '@/lib/metrics'
import { detectLang, type Lang } from '@/lib/i18n'

function GameContent() {
  const router = useRouter()
  const params = useSearchParams()
  const metric: MetricMode = 'followers'
  const genre = (params?.get('genre') as GenreCategory) || 'all'

  const [currentRound, setCurrentRound] = useState(1)
  const [questions, setQuestions] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<GameResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [lang] = useState<Lang>(() => detectLang())
  const [feedback, setFeedback] = useState<GameResult | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<Artist | null>(null)

  useEffect(() => {
    localStorage.removeItem('rankingSubmitted')
    const fetchQuestions = async () => {
      try {
        const region = params?.get('region') || localStorage.getItem('soundiq_region') || (detectLang() === 'ja' ? 'jp' : 'global')
        const locale = region === 'jp' ? 'ja' : 'en'
        const url = `/api/randomArtist?count=5&locale=${locale}${genre !== 'all' ? `&genre=${genre}` : ''}`
        const res = await fetch(url)
        const data = await res.json()
        if (res.ok && data.artists) {
          setQuestions(data.artists)
        }
      } catch (err) {
        console.error('Error fetching artists:', err)
      }
      setLoading(false)
    }
    fetchQuestions()
  }, [genre])

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
    setPendingAdvance(true)
  }

  const advanceRound = (newResults: GameResult[], newScore: number) => {
    if (currentRound < 5) {
      setCurrentRound(prev => prev + 1)
    } else {
      localStorage.setItem('gameResults', JSON.stringify({
        score: newScore,
        results: newResults,
        mode: genre !== 'all' ? 'genre' : 'classic',
        metric,
        genre,
      }))
      router.push('/results')
    }
  }

  const handleAnswer = async (artistName: string, artistId?: string) => {
    if (!artistName.trim() || !questions[currentRound - 1]) return

    let data
    if (artistId) {
      // Selected from dropdown — fetch by ID for accuracy, include name as fallback
      const res = await fetch(`/api/popularity?id=${encodeURIComponent(artistId)}&artist=${encodeURIComponent(artistName)}`)
      data = await res.json()
      if (!res.ok || !data.id) {
        alert(lang === 'ja' ? 'アーティストが見つかりません' : 'Artist not found.')
        return
      }
    } else {
      // Manual text input — search by name
      const res = await fetch(`/api/popularity?artist=${encodeURIComponent(artistName)}`)
      data = await res.json()
      if (!res.ok || !data.id) {
        alert(lang === 'ja' ? 'アーティストが見つかりません。候補リストから選んでください' : 'Artist not found. Please select from the suggestions.')
        return
      }
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
      advanceRound(results, totalScore)
    }
  }

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand rounded-full border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
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

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <GameContent />
    </Suspense>
  )
}
