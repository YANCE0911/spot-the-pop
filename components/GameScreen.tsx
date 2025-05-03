'use client'

import { useState } from 'react'

export default function GameScreen({ 
  currentRound, 
  totalRounds, 
  themeArtist, 
  onSubmitAnswer 
}) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    
    setLoading(true)
    await onSubmitAnswer(answer)
    setAnswer('')
    setLoading(false)
  }

  // スタイル定義
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

  // themeArtist が存在するかチェック
  if (!themeArtist) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent"></div>
    </div>
  }

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`${colors.green.primary} text-3xl font-bold`}>SPOT THE POP</h1>
            <div className="text-right">
              <span className="text-sm text-zinc-400">ROUND</span>
              <div className="text-2xl font-bold">{currentRound}/{totalRounds}</div>
            </div>
          </div>
          
          <div className="w-full bg-zinc-800 h-2 rounded-full">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${(currentRound / totalRounds) * 100}%` }}
            ></div>
          </div>
        </header>

        <div className={`${colors.zinc.bg.dark} p-6 rounded-lg shadow-lg`}>
          <div className="mb-6">
            <h2 className={`${colors.green.secondary} text-sm font-semibold uppercase tracking-wide mb-1`}>お題アーティスト</h2>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">{themeArtist.name}</h3>
              <div className="text-right">
                <div className={`${colors.green.secondary} text-sm font-semibold uppercase tracking-wide mb-1`}>人気度</div>
                <div className="text-2xl font-bold">?</div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`${colors.green.secondary} text-sm font-semibold block mb-2`}>
                このアーティストに近い人気度のアーティストを入力:
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className={`w-full ${colors.zinc.bg.medium} text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all`}
                placeholder="例: ラルク"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${colors.green.bg} text-black py-3 rounded-lg font-semibold ${colors.green.hover} transition-all duration-300`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                '回答を送信'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}