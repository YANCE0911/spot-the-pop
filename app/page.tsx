'use client'

import React, { useState } from 'react'

type ArtistResult = {
  name: string
  popularity: number
  diff: number
}

type FetchedArtist = {
  name: string
  popularity: number
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

  const handleResult = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResult(null)
    setError(null)

    try {
      const baseRes = await fetch(`/api/popularity?artist=${encodeURIComponent(baseArtist)}`)
      const baseData: FetchedArtist = await baseRes.json()

      if (!baseRes.ok) throw new Error((baseData as any).error)

      const basePop = baseData.popularity
      const baseName = baseData.name

      const results: ArtistResult[] = []
      for (const name of players) {
        if (!name.trim()) continue
        const res = await fetch(`/api/popularity?artist=${encodeURIComponent(name)}`)
        const data: FetchedArtist = await res.json()
        if (!res.ok) continue
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
    }
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1DB954] mb-6">Spotify 人気度バトル</h1>

        <form onSubmit={handleResult} className="space-y-4">
          <label className="block text-sm mb-1">お題のアーティスト名：</label>
          <input
            type="text"
            value={baseArtist}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseArtist(e.target.value)}
            className="w-full p-2 bg-zinc-800 text-white border border-zinc-700 rounded"
            placeholder="例: ラルク"
            required
          />

          <h2 className="text-lg font-semibold mt-6 mb-2">プレイヤーのアーティスト入力</h2>
          {players.map((p, i) => (
            <input
              key={i}
              type="text"
              value={p}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const copy = [...players]
                copy[i] = e.target.value
                setPlayers(copy)
              }}
              className="w-full p-2 bg-zinc-800 text-white border border-zinc-700 rounded mb-2"
              placeholder={`プレイヤー${i + 1} のアーティスト名`}
            />
          ))}

          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-[#1DB954] text-black font-semibold rounded hover:bg-[#1ed760]"
          >
            結果を表示
          </button>
        </form>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {result && (
          <div className="mt-8 bg-zinc-900 p-4 rounded">
            <h3 className="text-xl font-bold mb-2">お題: {result.baseName}（popularity: {result.basePop}）</h3>
            <ul className="space-y-2">
              {result.results.map((r, i) => (
                <li key={i} className="border-b border-zinc-700 pb-2">
                  {r.name} - popularity: {r.popularity}（差: {r.diff}）
                </li>
              ))}
            </ul>
            <p className="mt-4 text-lg font-semibold text-[#1DB954]">
              優勝: {result.results[0].name}（popularity: {result.results[0].popularity}）
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
