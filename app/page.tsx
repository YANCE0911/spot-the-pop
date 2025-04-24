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
    <main className="min-h-screen bg-black text-white py-8 px-4 font-sans antialiased">
      <div className="max-w-xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-green-500 tracking-tight">SPOTIFY 人気度バトル</h1>
        </header>

        <section className="mb-8">
          <form onSubmit={handleResult} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                お題のアーティスト名
              </label>
              <input
                type="text"
                value={baseArtist}
                onChange={(e) => setBaseArtist(e.target.value)}
                className="w-full p-3 bg-zinc-900 border-b-2 border-zinc-700 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-zinc-600"
                placeholder="例: ラルク"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                プレイヤーのアーティスト
              </label>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-6 text-center">{i + 1}</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const copy = [...players]
                        copy[i] = e.target.value
                        setPlayers(copy)
                      }}
                      className="w-full p-3 bg-zinc-900 border-b-2 border-zinc-700 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-zinc-600"
                      placeholder={`プレイヤー${i + 1} のアーティスト名`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-green-500 text-black font-medium rounded-sm hover:bg-green-400 transition-colors focus:outline-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        </section>

        {error && (
          <div className="mb-8 p-4 border-l-4 border-red-500 bg-zinc-900">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <section className="space-y-8">
            <div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2 mb-4">
                <div>
                  <h2 className="text-xs uppercase tracking-wider text-zinc-400 mb-1">お題</h2>
                  <h3 className="text-2xl font-bold">{result.baseName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Popularity</div>
                  <div className="text-2xl font-mono">{result.basePop}</div>
                </div>
              </div>
              <div className="w-full bg-zinc-800 h-1">
                <div 
                  className="bg-green-500 h-1" 
                  style={{ width: `${result.basePop}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs uppercase tracking-wider text-green-500 font-medium border-b border-zinc-800 pb-2 mb-4">
                結果ランキング
              </h3>
              
              <div className="space-y-4">
                {result.results.map((r, i) => (
                  <div 
                    key={i} 
                    className={`p-4 ${i === 0 ? 'bg-zinc-900 border-l-2 border-green-500' : 'bg-zinc-900/30'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 mr-3 ${
                          i === 0 ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400'
                        } text-xs font-medium`}>
                          {i + 1}
                        </span>
                        <div>
                          <h4 className="font-medium">{r.name}</h4>
                          <div className="text-xs text-zinc-400 mt-1">
                            差: <span className={i === 0 ? 'text-green-500' : 'text-zinc-300'}>{r.diff}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-mono">{r.popularity}</div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1">
                      <div 
                        className={`${i === 0 ? 'bg-green-500' : 'bg-zinc-600'} h-1`}
                        style={{ width: `${r.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {result.results.length > 0 && (
                <div className="mt-8 p-4 bg-zinc-900/70 border-t border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-green-500 mb-1 font-medium">優勝</div>
                      <div className="text-xl font-bold">{result.results[0].name}</div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-mono text-green-500">{result.results[0].popularity}</span>
                      <span className="ml-2 text-xs text-zinc-500">/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}