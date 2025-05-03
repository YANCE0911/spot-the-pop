'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GameScreen from '@/components/GameScreen'

export default function Game() {
  const router = useRouter()
  const [currentRound, setCurrentRound] = useState(1)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState([])
  const [results, setResults] = useState([])
  const [totalScore, setTotalScore] = useState(0)

  // ゲーム開始時にランダムなお題アーティストを10個取得
  useEffect(() => {
    const fetchRandomArtists = async () => {
      try {
        const res = await fetch('/api/randomArtist?count=10')
        const data = await res.json()

        if (res.ok && data.artists) {
          setQuestions(data.artists)
        } else {
          console.error('Failed to fetch random artists')
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching artists:', err)
        setLoading(false)
      }
    }

    fetchRandomArtists()
  }, [])

  // 回答を保存し次のラウンドへ
  const handleAnswer = async (artistName: string) => {
    if (!artistName.trim()) return

    try {
      if (questions.length === 0 || currentRound > questions.length) {
        console.error('No questions available')
        return
      }

      const themeArtist = questions[currentRound - 1]

      // アーティスト情報をSpotify APIから取得（名前からIDと人気度を取得）
      const res = await fetch(`/api/popularity?artist=${encodeURIComponent(artistName)}`)
      const data = await res.json()

      if (!res.ok || !data.popularity || !data.id) {
        alert('アーティスト情報の取得に失敗しました。正しい名前か確認してください。')
        return
      }

      const answerId = data.id
      const answerPopularity = data.popularity

      // 同じIDのアーティストはNG（テーマと同じ）
      if (answerId === themeArtist.id) {
        alert('お題と同じアーティストは回答できません！')
        return
      }

      const diff = Math.abs(answerPopularity - themeArtist.popularity)

      setAnswers(prev => [...prev, { name: artistName, popularity: answerPopularity }])

      const newResult = {
        theme: themeArtist.name,
        themePopularity: themeArtist.popularity,
        answer: artistName,
        answerPopularity,
        diff
      }

      setResults(prev => [...prev, newResult])
      const newTotalScore = totalScore + diff
      setTotalScore(newTotalScore)

      if (currentRound < 10) {
        setCurrentRound(prev => prev + 1)
      } else {
        // 最終ラウンド後、ローカルストレージに結果を保存してリザルト画面へ
        if (typeof window !== 'undefined') {
          localStorage.setItem('gameResults', JSON.stringify({
            score: newTotalScore,
            results: [...results, newResult]
          }))
        }

        router.push('/results')
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">アーティストの読み込みに失敗しました</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-500 text-black py-2 px-4 rounded hover:bg-green-400"
          >
            トップに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <GameScreen
      currentRound={currentRound}
      totalRounds={10}
      themeArtist={questions[currentRound - 1]}
      onSubmitAnswer={handleAnswer}
    />
  )
}
