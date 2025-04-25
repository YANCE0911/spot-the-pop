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

  return (
    <main className="min-h-screen bg-black text-white px-6 py-14 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-green-500 text-5xl font-extrabold tracking-tight">Spotify 人気度バトル</h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl mx-auto">
            Spotifyの人気度（popularity）は、再生回数やシェア数、プレイリスト追加数などをもとに0〜100で算出されるスコアです。最近の活動が重視されます。
          </p>
        </header>

        <form onSubmit={handleResult} className="space-y-8 bg-zinc-900 p-6 rounded-xl shadow-lg ring-1 ring-zinc-800">
          <div>
            <label className="text-green-400 font-semibold text-sm mb-2 block">お題アーティスト</label>
            <input
              type="text"
              value={baseArtist}
              onChange={(e) => setBaseArtist(e.target.value)}
              className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="例：ラルク"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-green-400 font-semibold text-sm">プレイヤーのアーティスト</label>
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
                className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder={`プレイヤー${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-3 rounded-lg font-semibold hover:bg-green-400 transition-all duration-300"
          >
            {loading ? '検索中...' : '結果を見る'}
          </button>
        </form>

        {error && (
          <div className="bg-red-800/80 text-white p-4 rounded-lg shadow ring-1 ring-red-900">
            {error}
          </div>
        )}

        {result && (
          <section className="bg-zinc-900 p-6 rounded-xl shadow-lg ring-1 ring-zinc-800">
            <h2 className="text-green-500 text-xl font-bold mb-4">お題：{result.baseName}（人気度：{result.basePop}）</h2>
            <ul className="space-y-4">
              {result.results.map((r, i) => (
                <li
                  key={i}
                  className={`flex justify-between items-center p-4 rounded-lg ${i === 0 ? 'bg-green-600 text-black' : 'bg-zinc-800 text-white'}`}
                >
                  <span className="font-medium">{i + 1}. {r.name}</span>
                  <span className="text-sm">差 {r.diff}｜人気度 {r.popularity}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
