'use client'
import { useState } from 'react'

export default function Home() {
  const [baseArtist, setBaseArtist] = useState('')
  const [players, setPlayers] = useState(['', '', ''])
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const fetchPopularity = async (name: string) => {
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
        .map((p, i) => p && ({ name: p.name, pop: p.popularity, diff: Math.abs(p.popularity - base.popularity) }))
        .filter(Boolean)
        .sort((a, b) => a!.diff - b!.diff)

      setResults([
        { name: base.name, pop: base.popularity, isBase: true },
        ...scored,
      ])
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-8">
      <h1 className="text-4xl font-bold text-[#1DB954]">🎵 Spotify 人気度バトル</h1>

      <div className="flex flex-wrap gap-2 w-full justify-center max-w-4xl">
        <input
          className="p-2 rounded bg-neutral-900 border border-gray-600 text-white w-40"
          placeholder="🎯 お題のアーティスト名"
          value={baseArtist}
          onChange={e => setBaseArtist(e.target.value)}
        />
        {players.map((p, i) => (
          <input
            key={i}
            className="p-2 rounded bg-neutral-900 border border-gray-600 text-white w-40"
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
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#1DB954] text-black font-bold rounded hover:bg-green-400 transition"
        >
          勝負する！
        </button>
      </div>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6 w-full max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-2">結果</h2>
          <ul className="space-y-1">
            {results.map((r, i) => (
              <li key={i} className={`p-2 rounded ${r.isBase ? 'bg-neutral-800' : 'bg-neutral-700'} flex justify-between`}>
                <span>{r.name}</span>
                <span>{r.pop}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-green-400 font-bold">🎉 優勝：{results[1]?.name}（popularity {results[1]?.pop}）</p>
        </div>
      )}
    </main>
  )
}
