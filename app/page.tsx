'use client'
import { useState } from 'react'

// 型定義
type ArtistResult = {
  name: string
  popularity: number
  diff?: number
  isBase?: boolean
}

export default function Home() {
  const [baseArtist, setBaseArtist] = useState('')
  const [players, setPlayers] = useState<string[]>(['', '', ''])
  const [results, setResults] = useState<ArtistResult[]>([])
  const [error, setError] = useState('')

  const fetchPopularity = async (name: string): Promise<ArtistResult> => {
    const res = await fetch(`/api/popularity?artist=${encodeURIComponent(name)}`)
    if (!res.ok) throw new Error(`${name} not found`)
    return await res.json()
  }

  const handleSubmit = async () => {
    setError('')
    setResults([])

    try {
      const base = await fetchPopularity(baseArtist)
      const others = await Promise.all(players.map(p => p ? fetchPopularity(p) : null))

      const scored = others
        .map((p) => {
          if (!p) return null
          return {
            name: p.name,
            popularity: p.popularity,
            diff: Math.abs(p.popularity - base.popularity),
          } as ArtistResult
        })
        .filter((p): p is ArtistResult => p !== null)
        .sort((a, b) => a.diff! - b.diff!)

      setResults([
        { name: base.name, popularity: base.popularity, isBase: true },
        ...scored,
      ])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white flex flex-col items-center justify-start py-12 px-6 space-y-10 font-sans">
      <h1 className="text-5xl font-extrabold text-[#1DB954] drop-shadow-xl">🎵 Spotify 人気度バトル</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex flex-col md:flex-row md:flex-wrap gap-4 w-full max-w-5xl justify-center items-center"
      >
        <input
          className="p-3 rounded bg-neutral-800 border border-neutral-600 text-white w-72 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
          placeholder="🎯 お題のアーティスト名"
          value={baseArtist}
          onChange={e => setBaseArtist(e.target.value)}
        />
        {players.map((p, i) => (
          <input
            key={i}
            className="p-3 rounded bg-neutral-800 border border-neutral-600 text-white w-72 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
            placeholder={`👤 プレイヤー${i + 1}`}
            value={p}
            onChange={e => {
              const copy = [...players]
              copy[i] = e.target.value
              setPlayers(copy)
            }}
          />
        ))}
        <button
          type="submit"
          className="px-6 py-3 mt-2 md:mt-0 bg-[#1DB954] text-black text-lg font-semibold rounded-full hover:bg-green-400 transition shadow-lg"
        >
          🏁 勝負する！
        </button>
      </form>

      {error && <p className="text-red-400 font-semibold text-sm">⚠️ {error}</p>}

      {results.length > 0 && (
        <div className="mt-10 w-full max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 結果発表</h2>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li
                key={i}
                className={`p-4 rounded-lg flex justify-between items-center text-lg font-medium ${r.isBase ? 'bg-neutral-800 text-[#1DB954]' : 'bg-neutral-700 text-white'} shadow-md`}
              >
                <span>{r.name}</span>
                <span>{r.popularity}</span>
              </li>
            ))}
          </ul>
          {results.length > 1 && (
            <p className="mt-6 text-xl text-[#1DB954] font-extrabold animate-pulse">
              🎉 優勝：{results[1].name}（popularity {results[1].popularity}）
            </p>
          )}
        </div>
      )}
    </main>
  )
}