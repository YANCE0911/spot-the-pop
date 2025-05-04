'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveRanking } from '@/lib/ranking'

// 👇 ここ追加！
type ResultItem = {
  theme: string
  themePopularity: number
  answer: string
  answerPopularity: number
  diff: number
}

export default function Results() {
  const router = useRouter()
  const [score, setScore] = useState(0)

  // 👇 ここ型指定追加！
  const [results, setResults] = useState<ResultItem[]>([])

  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedResults = localStorage.getItem('gameResults')
        const submittedScore = localStorage.getItem('rankingSubmittedScore')

        if (savedResults) {
          const parsedData = JSON.parse(savedResults)
          setScore(parsedData.score)
          setResults(parsedData.results || [])

          if (submittedScore && Number(submittedScore) === parsedData.score) {
            setSubmitted(true)
          }
        } else {
          router.push('/game')
        }
      } catch (error) {
        console.error('Failed to parse results:', error)
        router.push('/game')
      }
    }
    setLoading(false)
  }, [router])

  const handleSubmitRanking = async () => {
    if (!playerName.trim()) {
      alert('名前を入力してください！')
      return
    }

    try {
      console.log('👤 登録処理開始:', playerName, score)
      await saveRanking(playerName, score)
      localStorage.setItem('rankingSubmittedScore', score.toString())
      console.log('🎉 登録成功！')
      setSubmitted(true)
    } catch (err) {
      console.error('❌ 登録失敗:', err)
      alert('登録に失敗しました。もう一度お試しください。')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  const colors = {
    green: {
      primary: 'text-green-500',
      secondary: 'text-green-500',
    },
    zinc: {
      bg: {
        dark: 'bg-zinc-900',
        medium: 'bg-zinc-800',
      },
    },
  }

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-green-500 text-3xl font-bold text-center mb-4">ゲーム結果</h1>
          <div className="text-center">
            <p className="text-xl mb-2">最終スコア:</p>
            <p className="text-4xl font-bold mb-6">{Math.round(score)}</p>
            <p className="text-sm text-zinc-400">※スコアが低いほど優秀です</p>
          </div>
        </header>

        {!submitted ? (
          <div className="bg-zinc-800 p-6 rounded-lg shadow-lg text-center space-y-4">
            <h2 className="text-xl font-bold text-green-500">ランキングに登録</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              className="w-full p-2 rounded text-black"
            />
            <button
              onClick={handleSubmitRanking}
              className="bg-green-500 text-black py-2 px-4 rounded hover:bg-green-400"
            >
              登録する
            </button>
          </div>
        ) : (
          <div className="text-center text-green-400 font-semibold">
            登録しました！ありがとう 🎉
          </div>
        )}

        {results && results.length > 0 ? (
          <div className={`${colors.zinc.bg.dark} p-6 rounded-lg shadow-lg`}>
            <h2 className={`${colors.green.secondary} text-xl font-bold mb-4`}>ラウンド結果</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`${colors.zinc.bg.medium} p-4 rounded-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm text-zinc-400">ラウンド {index + 1}</span>
                      <h3 className="font-bold">{result.theme}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-zinc-400">人気度</span>
                      <p className="font-bold">{result.themePopularity}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <span className="text-sm text-zinc-400">あなたの回答</span>
                      <h3 className="font-bold">{result.answer}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-zinc-400">人気度</span>
                      <p className="font-bold">{result.answerPopularity}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-sm text-zinc-400">差</span>
                    <p className={`font-bold ${result.diff < 10 ? 'text-green-500' : ''}`}>
                      {result.diff}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${colors.zinc.bg.dark} p-6 rounded-lg shadow-lg text-center`}>
            <p>結果データがありません。ゲームを最初からプレイしてください。</p>
          </div>
        )}

        <div className="flex justify-center space-x-4 pt-6">
          <button
            onClick={() => router.push('/game')}
            className="bg-green-500 text-black py-3 px-6 rounded-lg font-semibold hover:bg-green-400 transition-all duration-300"
          >
            もう一度プレイ
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-zinc-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-zinc-700 transition-all duration-300"
          >
            トップに戻る
          </button>
        </div>
      </div>
    </main>
  )
}
