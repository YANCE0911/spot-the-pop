'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

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
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white flex flex-col items-center justify-start py-12 px-6 space-y-10 font-sans"
    >
      <h1 className="text-5xl font-extrabold text-[#1DB954] drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] tracking-wider">
        🎵 Spotify 人気度バトル
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex flex-col md:flex-row md:flex-wrap gap-4 w-full max-w-5xl justify-center items-center"
      >
        <input
          className="p-3 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white w-72 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:ring-offset-2"
          placeholder="🎯 お題のアーティスト名"
          value={baseArtist}
          onChange={e => setBaseArtist(e.target.value)}
        />
        {players.map((p, i) => (
          <input
            key={i}
            className="p-3 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white w-72 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:ring-offset-2"
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
          className="px-6 py-3 mt-2 md:mt-0 bg-[#1DB954] text-black text-lg font-semibold rounded-full hover:bg-green-400 transition transform hover:scale-105 shadow-md"
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
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-lg flex justify-between items-center text-lg font-medium ${r.isBase
                  ? 'bg-gradient-to-r from-neutral-700 via-neutral-800 to-black text-[#1DB954]'
                  : 'bg-gradient-to-r from-neutral-800 via-black to-neutral-900 text-white'} shadow-lg`}
              >
                <span>{r.name}</span>
                <span>{r.popularity}</span>
              </motion.li>
            ))}
          </ul>
          {results.length > 1 && (
            <motion.p
              className="mt-6 text-xl text-[#1DB954] font-extrabold animate-pulse"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ yoyo: Infinity, duration: 0.8 }}
            >
              🎉 優勝：{results[1].name}（popularity {results[1].popularity}）
            </motion.p>
          )}
        </div>
      )}
    </motion.main>
  )
}