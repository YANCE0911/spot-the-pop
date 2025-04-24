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
    <main className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-green-500 text-center">SPOTIFY 人気度バトル</h1>
        </header>

        <form onSubmit={handleResult} className="space-y-8">
          <div>
            <label className="block text-green-500 text-sm font-medium mb-2">
              お題のアーティスト名
            </label>
            <input
              type="text"
              value={baseArtist}
              onChange={(e) => setBaseArtist(e.target.value)}
              className="w-full p-3 bg-zinc-900 text-white border-none rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="例: ラルク"
              required
            />
          </div>

          <div>
            <label className="block text-green-500 text-sm font-medium mb-2">
              プレイヤーのアーティスト入力
            </label>
            <div className="space-y-3">
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
                  className="w-full p-3 bg-zinc-900 text-white border-none rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder={`プレイヤー${i + 1} のアーティスト名`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 p-3 bg-green-500 text-black font-medium rounded hover:bg-green-400 transition-colors focus:outline-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                取得中...
              </span>
            ) : (
              '結果を表示'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-900/30 text-red-400 rounded">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <div className="p-4 bg-zinc-900 rounded">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm text-green-500 mb-1">お題</h2>
                  <h3 className="text-xl font-bold">{result.baseName}</h3>
                </div>
                <div>
                  <div className="text-sm text-green-500 mb-1">Popularity</div>
                  <div className="text-xl font-bold">{result.basePop}</div>
                </div>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${result.basePop}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-green-500 mb-4">結果ランキング</h3>
              
              <div className="space-y-4">
                {result.results.map((r, i) => (
                  <div 
                    key={i} 
                    className={`p-4 ${i === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'} rounded`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                          i === 0 ? 'bg-green-500 text-black' : 'bg-zinc-800 text-white'
                        } text-sm font-medium`}>
                          {i + 1}
                        </span>
                        <div>
                          <h4 className="font-medium">{r.name}</h4>
                          <div className="text-sm text-zinc-400">
                            差: {r.diff}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-bold">{r.popularity}</div>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full">
                      <div 
                        className={`${i === 0 ? 'bg-green-500' : 'bg-zinc-600'} h-2 rounded-full`}
                        style={{ width: `${r.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {result.results.length > 0 && (
                <div className="mt-6 p-4 bg-zinc-900 rounded border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-500 mb-1">優勝</div>
                      <div className="text-xl font-bold">{result.results[0].name}</div>
                    </div>
                    <div className="text-2xl font-bold text-green-500">{result.results[0].popularity}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}