'use client'

import React, { useState } from 'react'
import './globals.css'

type ArtistResult = {
  name: string
  popularity: number
  diff: number
}

type FetchedArtist = {
  name: string
  popularity: number
  error?: string
}

export default function Home() {
  const [baseArtist, setBaseArtist] = useState('')
  const [players, setPlayers] = useState<string[]>(['', '', '', '', ''])
  const [result, setResult] = useState<{
    baseName: string
    basePop: number
    results: ArtistResult[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleResult = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const baseRes = await fetch(`/api/popularity?artist=${encodeURIComponent(baseArtist)}`)
      const baseData: FetchedArtist = await baseRes.json()

      if (!baseRes.ok || !('popularity' in baseData)) throw new Error(baseData.error || 'アーティスト取得に失敗しました')

      const basePop = baseData.popularity
      const baseName = baseData.name

      const results: ArtistResult[] = []
      for (const name of players) {
        if (!name.trim()) continue
        const res = await fetch(`/api/popularity?artist=${encodeURIComponent(name)}`)
        const data: FetchedArtist = await res.json()
        if (!res.ok || !('popularity' in data)) continue
        results.push({
          name: data.name,
          popularity: data.popularity,
          diff: Math.abs(data.popularity - basePop),
        })
      }

      results.sort((a, b) => a.diff - b.diff)
      setResult({ baseName, basePop, results })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('エラーが発生しました')
      }
    } finally {
      setLoading(false)
    }
  }

  // 色を統一するための定数
  const colors = {
    green: {
      primary: "text-green-500", // タイトルなど主要な緑色テキスト
      secondary: "text-green-500", // ラベルなど二次的な緑色テキスト
      bg: "bg-green-500", // 緑色の背景
      hover: "hover:bg-green-400", // ホバー時の緑色
      focus: "focus:ring-green-500", // フォーカス時のリング色
    },
    zinc: {
      bg: {
        dark: "bg-zinc-900", // 暗いグレー背景（カード）
        medium: "bg-zinc-800", // 中間のグレー背景（入力欄）
        light: "bg-zinc-700", // 明るいグレー背景（番号円など）
      },
      border: "border-zinc-800", // ボーダー色
      text: {
        light: "text-white", // 明るいテキスト
        medium: "text-zinc-300", // 中間のテキスト
        dark: "text-zinc-500", // 暗いテキスト
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-14 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="text-center mb-12">
          <h1 className={`${colors.green.primary} text-5xl font-extrabold tracking-tight mb-10`}>Spotify 人気度バトル</h1>
          <div className={`${colors.zinc.bg.medium} ${colors.zinc.text.light} p-5 rounded-lg shadow-lg max-w-xl mx-auto`}>
            <p className="text-base leading-relaxed">
              <span className={`${colors.green.secondary} font-medium`}>人気度（popularity）</span>はSpotifyの内部指標です。再生回数・リスナー数・成長速度などから算出され、<span className={`${colors.green.secondary} font-medium`}>0〜100の数値</span>で表されます。
            </p>
          </div>
        </header>

        <form onSubmit={handleResult} className={`space-y-8 ${colors.zinc.bg.dark} p-6 rounded-xl shadow-lg ring-1 ring-${colors.zinc.border}`}>
          <div>
            <label className={`${colors.green.secondary} font-semibold text-sm mb-2 block`}>お題アーティスト</label>
            <input
              type="text"
              value={baseArtist}
              onChange={(e) => setBaseArtist(e.target.value)}
              className={`w-full ${colors.zinc.bg.medium} ${colors.zinc.text.light} p-3 rounded-lg outline-none focus:ring-2 ${colors.green.focus} transition-all`}
              placeholder="例：ラルク"
              required
            />
          </div>

          <div className="space-y-4">
            <label className={`${colors.green.secondary} font-semibold text-sm`}>プレイヤーのアーティスト</label>
            {players.map((p, i) => (
              <input
                key={i}
                type="text"
                value={p}
                onChange={(e) => {
                  const copy = [...players]
                  copy[i] = e.target.value
                  setPlayers(copy)
                }}
                className={`w-full ${colors.zinc.bg.medium} ${colors.zinc.text.light} p-3 rounded-lg outline-none focus:ring-2 ${colors.green.focus} transition-all`}
                placeholder={`プレイヤー${i + 1}`}
              />
            ))}
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
                検索中...
              </span>
            ) : (
              '結果を見る'
            )}
          </button>
        </form>

        {error && (
          <div className="bg-red-800/80 text-white p-4 rounded-lg shadow ring-1 ring-red-900">
            {error}
          </div>
        )}

        {result && (
          <section className={`${colors.zinc.bg.dark} p-6 rounded-xl shadow-lg ring-1 ring-${colors.zinc.border}`}>
            <div className={`flex justify-between items-center mb-6 pb-4 border-b ${colors.zinc.border}`}>
              <div>
                <h2 className={`${colors.green.secondary} text-sm font-semibold uppercase tracking-wide mb-1`}>お題</h2>
                <h3 className="text-2xl font-bold">{result.baseName}</h3>
              </div>
              <div className="text-right">
                <div className={`${colors.green.secondary} text-sm font-semibold uppercase tracking-wide mb-1`}>人気度</div>
                <div className="text-2xl font-bold">{result.basePop}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className={`${colors.green.secondary} text-sm font-semibold uppercase tracking-wide mb-3`}>結果ランキング</h3>
              <ul className="space-y-3">
                {result.results.map((r, i) => (
                  <li
                    key={i}
                    className={`flex justify-between items-center p-4 rounded-lg ${i === 0 ? `${colors.green.bg} text-black` : `${colors.zinc.bg.medium} ${colors.zinc.text.light}`}`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 ${
                        i === 0 ? `bg-black ${colors.green.primary}` : `${colors.zinc.bg.light} ${colors.zinc.text.light}`
                      } text-xs font-medium`}>
                        {i + 1}
                      </span>
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="text-sm">
                      差 <span className="font-bold">{r.diff}</span> | 人気度 <span className="font-bold">{r.popularity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {result.results.length > 0 && (
              <div className={`mt-8 pt-4 border-t ${colors.zinc.border}`}>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${colors.green.primary}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className={`text-xs ${colors.green.secondary} uppercase tracking-wide font-medium`}>優勝</div>
                    <div className="font-bold">{result.results[0].name}</div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}