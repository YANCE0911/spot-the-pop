"use client"
import { useState } from "react"

export default function Home() {
  const [base, setBase] = useState("")
  const [players, setPlayers] = useState(["", "", ""])
  const [result, setResult] = useState<any[] | null>(null)
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

    const filtered = results.filter(Boolean) as any[]
    filtered.sort((a, b) => a.diff - b.diff)
    setResult(filtered)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-[#1DB954] mb-4">🎵 Spotify 人気度バトル</h1>

      <input
        type="text"
        value={base}
        onChange={(e) => setBase(e.target.value)}
        placeholder="お題のアーティスト"
        className="p-2 text-black rounded w-72 mb-4"
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
          placeholder={`プレイヤー${i + 1}`}
          className="p-2 text-black rounded w-72 mb-2"
        />
      ))}

      <button
        onClick={handleSubmit}
        className="mt-2 px-4 py-2 bg-[#1DB954] text-black rounded hover:opacity-90"
      >
        勝負する！
      </button>

      {result && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-lg text-[#1DB954]">お題のpopularity: {basePop}</p>
          <h2 className="text-xl font-bold mb-2">🏆 結果発表</h2>
          {result.map((r, i) => (
            <p key={i}>{r.name}: popularity {r.popularity}（差: {r.diff}）</p>
          ))}
          <p className="mt-4 font-bold text-[#1DB954]">🎉 優勝：{result[0].name}</p>
        </div>
      )}
    </main>
  )
}
