"use client"
import { useState } from "react"

type PlayerResult = {
  name: string
  popularity: number
  diff: number
}

export default function Home() {
  const [base, setBase] = useState("")
  const [players, setPlayers] = useState(["", "", ""])
  const [result, setResult] = useState<PlayerResult[] | null>(null)
  const [basePop, setBasePop] = useState<number | null>(null)

  const handleSubmit = async () => {
    const baseRes = await fetch(`/api/popularity?artist=${encodeURIComponent(base)}`)
    const baseData = await baseRes.json()
    if (!baseData.popularity) {
      alert("お題のアーティストが見つかりませんでした")
      return
    }
    setBasePop(baseData.popularity)

    const results = await Promise.all(players.map(async (name) => {
      if (!name) return null
      const res = await fetch(`/api/popularity?artist=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (!data.popularity) return null
      return {
        name: data.name,
        popularity: data.popularity,
        diff: Math.abs(data.popularity - baseData.popularity)
      }
    }))

    const filtered = results.filter(Boolean) as PlayerResult[]
    filtered.sort((a, b) => a.diff - b.diff)
    setResult(filtered)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-6 font-sans">
      <h1 className="text-4xl font-bold text-[#1DB954] mb-6">🎵 Spotify 人気度バトル</h1>

      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <input
          type="text"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="🎯 お題のアーティスト名"
          className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-500 shadow"
        />

        {players.map((p, i) => (
          <input
            key={i}
            type="text"
            value={players[i]}
            onChange={(e) => {
              const newP = [...players]
              newP[i] = e.target.value
              setPlayers(newP)
            }}
            placeholder={`👤 プレイヤー${i + 1}`}
            className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-500 shadow"
          />
        ))}

        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-[#1DB954] text-black font-semibold py-2 rounded hover:opacity-90 shadow"
        >
          勝負する！
        </button>
      </div>

      {result && (
        <div className="mt-8 text-center space-y-2">
          <p className="text-lg text-[#1DB954]">🎯 お題のpopularity: {basePop}</p>
          <h2 className="text-xl font-bold mb-2">🏆 結果発表</h2>
          {result.map((r, i) => (
            <p key={i} className="text-white">
              {r.name}: popularity {r.popularity}（差: {r.diff}）
            </p>
          ))}
          <p className="mt-4 text-[#1DB954] font-bold text-lg">🎉 優勝：{result[0].name}</p>
        </div>
      )}
    </main>
  )
}
