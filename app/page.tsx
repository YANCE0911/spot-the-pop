'use client'

import React, { useState } from 'react'

// 型定義
interface ArtistResult {
  name: string
  popularity: number
  diff: number
}

interface FetchedArtist {
  name: string
  popularity: number
  error?: string
}

export default function Home() {
  const [baseArtist, setBaseArtist] = useState<string>('')
  const [players, setPlayers] = useState<string[]>(['', '', '', '', ''])
  const [result, setResult] = useState<{
    baseName: string
    basePop: number
    results: ArtistResult[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

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

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 font-sans transition-all duration-200 ease-in-out">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="black" />
                <path d="M17 15c-3 2-7 2-10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M17 12c-3 2-8 2-11 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 9c-2 1-6 1-9 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-green-500 tracking-tight">Spotify 人気度バトル</h1>
            <p className="text-zinc-400 text-sm mt-2">アーティストの人気度を比較して勝者を決めよう</p>
          </div>
        </header>

        <form onSubmit={handleResult} className="space-y-6 bg-zinc-900 p-6 rounded-lg shadow">
          <div>
            <label className="text-green-500 block mb-2">お題アーティスト</label>
            <input
              type="text"
              value={baseArtist}
              onChange={(e) => setBaseArtist(e.target.value)}
              className="w-full p-3 rounded-md bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="例: L'Arc~en~Ciel"
              required
            />
          </div>
          <div className="space-y-3">
            {players.map((p, i) => (
              <input
                key={i}
                type="text"
                value={p}
                onChange={(e) => {
                  const updated = [...players]
                  updated[i] = e.target.value
                  setPlayers(updated)
                }}
                placeholder={`プレイヤー${i + 1}`}
                className="w-full p-3 rounded-md bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            ))}
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-md transition"
          >
            {loading ? '取得中...' : '結果を表示'}
          </button>
        </form>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 bg-zinc-900 p-6 rounded-lg">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-400">お題: {result.baseName}</h2>
              <span className="text-sm text-white/70">Popularity: {result.basePop}</span>
            </div>
            <div className="space-y-3">
              {result.results.map((r, i) => (
                <div key={i} className={`p-4 rounded-md ${i === 0 ? 'bg-green-500 text-black' : 'bg-zinc-800 text-white'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{i + 1}. {r.name} {i === 0 && '👑'}</span>
                    <span className="text-sm">popularity: {r.popularity}（差 {r.diff}）</span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${i === 0 ? 'bg-black' : 'bg-green-500'}`} style={{ width: `${r.popularity}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-zinc-500 text-xs">
          <p>Powered by DIGLE MAGAZINE</p>
        </footer>
      </div>
    </main>
  )
}
