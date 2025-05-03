'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTopRankings } from '@/lib/ranking'

export default function Home() {
  const router = useRouter()
  const [rankings, setRankings] = useState<any[]>([])

  const colors = {
    green: {
      primary: "text-green-500",
      secondary: "text-green-500",
      bg: "bg-green-500",
      hover: "hover:bg-green-400",
    },
    zinc: {
      bg: {
        dark: "bg-zinc-900",
        medium: "bg-zinc-800",
      },
      text: {
        light: "text-white",
        medium: "text-zinc-300",
      }
    }
  }

  const startGame = () => {
    router.push('/game')
  }

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const top = await getTopRankings()
        setRankings(top)
      } catch (err) {
        console.error('🏆 ランキング取得失敗:', err)
      }
    }
    fetchRankings()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="mb-12">
          <h1 className={`${colors.green.primary} text-5xl font-extrabold tracking-tight mb-10 text-center`}>
            SPOT THE POP
          </h1>
          <div className={`${colors.zinc.bg.medium} ${colors.zinc.text.light} p-6 rounded-lg shadow-lg max-w-2xl mx-auto text-left space-y-4`}>
            <p className="text-base leading-relaxed">
              ランダムに出題される10組のアーティストに対して、より近い
              <span className={`${colors.green.secondary} font-medium`}>「人気度」</span>のアーティストを予想するチャレンジです。
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              ※ 各お題との人気度の差が少ないほど高得点。10問の合計スコアで競います。
              上位10名はランキングに名前が載ります！
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              ※ 「人気度」は直近1ヶ月の再生回数・リスナー数などを総合的に反映した公式スコアであり、日々変動します。
            </p>
          </div>
        </header>

        <div className="text-center">
          <button
            onClick={startGame}
            className={`${colors.green.bg} text-black py-4 px-8 rounded-lg font-bold text-lg ${colors.green.hover} transition-all duration-300`}
          >
            チャレンジ開始
          </button>
        </div>
        
        <section className={`${colors.zinc.bg.medium} p-6 rounded-lg shadow-lg`}>
          <h2 className="text-2xl font-bold text-green-500 mb-4 text-center">🏆 ランキング TOP10</h2>
          {rankings.length > 0 ? (
            <ol className="space-y-2">
              {rankings.map((entry, index) => (
                <li key={index} className="flex justify-between text-zinc-200 border-b border-zinc-700 pb-1">
                  <span className="font-medium">{index + 1}位：{entry.name}</span>
                  <span>スコア {Math.round(entry.score)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-center text-zinc-400">ランキングを読み込み中...</p>
          )}
        </section>

        
      </div>
    </main>
  )
}
