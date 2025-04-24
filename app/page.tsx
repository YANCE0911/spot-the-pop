'use client'

import { useState } from 'react'

export default function Home() {
  const [baseArtist, setBaseArtist] = useState('')
  const [playerInputs, setPlayerInputs] = useState(['', '', '', '', ''])
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [baseName, setBaseName] = useState('')
  const [basePop, setBasePop] = useState<number | null>(null)

  const getPopularity = async (name: string) => {
    const res = await fetch(`/api/popularity?artist=${encodeURIComponent(name)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data
  }

  const handleClick = async () => {
    setError('')
    setResults([])
    const base = await getPopularity(baseArtist)
    if (!base) return setError('お題のアーティストが見つかりませんでした')

    setBaseName(base.name)
    setBasePop(base.popularity)

    const resultsList = []
    for (const input of playerInputs) {
      const data = await getPopularity(input)
      if (data) {
        resultsList.push({
          name: data.name,
          popularity: data.popularity,
          diff: Math.abs(data.popularity - base.popularity)
        })
      }
    }
    setResults(resultsList.sort((a, b) => a.diff - b.diff))
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1DB954] mb-8">Spotify 人気度バトル</h1>

        <label className="block mb-2 text-white">お題のアーティスト名を入力：</label>
        <input
          value={baseArtist}
          onChange={(e) => setBaseArtist(e.target.value)}
          className="w-full p-3 mb-6 text-black rounded focus:outline-none"
        />

        {baseName && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">お題：{baseName}</h2>
          </div>
        )}

        <h3 className="text-white mb-4 text-lg font-semibold">プレイヤーのアーティスト入力</h3>
        {playerInputs.map((value, i) => (
          <input
            key={i}
            value={value}
            onChange={(e) => {
              const newInputs = [...playerInputs]
              newInputs[i] = e.target.value
              setPlayerInputs(newInputs)
            }}
            className="w-full p-3 mb-4 text-black rounded focus:outline-none"
            placeholder={`プレイヤー${i + 1} のアーティスト名`}
          />
        ))}

        <button
          onClick={handleClick}
          className="mt-2 px-6 py-3 bg-[#1DB954] text-black font-semibold rounded hover:bg-green-500 transition"
        >
          結果を表示
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {results.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 text-white">🎉 結果</h3>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="bg-gray-800 rounded px-4 py-2">
                  <strong>{r.name}</strong>（{r.popularity}）- 差: {r.diff}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-white">👑 優勝：<strong>{results[0].name}</strong>（{results[0].popularity}）</p>
          </div>
        )}
      </div>
    </main>
  )
}
