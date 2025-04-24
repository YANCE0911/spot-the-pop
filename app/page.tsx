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
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center">
          <svg className="w-8 h-8 mr-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.839-.179-.959-.6-.12-.421.18-.84.6-.96 4.56-1.021 8.52-.6 11.64 1.32.42.237.48.659.301 1.141zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <h1 className="text-3xl font-bold text-white">Spotify 人気度バトル</h1>
        </header>

        <section className="bg-zinc-900 rounded-lg p-6 shadow-lg mb-6">
          <form onSubmit={handleResult} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                お題のアーティスト名
              </label>
              <input
                type="text"
                value={baseArtist}
                onChange={(e) => setBaseArtist(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                placeholder="例: ラルク"
                required
              />
            </div>

            <div>
              <h2 className="text-sm font-medium text-green-400 mb-2">
                プレイヤーのアーティスト入力
              </h2>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="flex items-center">
                    <span className="mr-2 text-sm text-zinc-400 w-10 flex-shrink-0">P{i + 1}</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const copy = [...players]
                        copy[i] = e.target.value
                        setPlayers(copy)
                      }}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                      placeholder={`プレイヤー${i + 1} のアーティスト名`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-zinc-900"
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
          <div className="bg-red-900/50 border border-red-800 rounded-md p-4 mb-6 text-red-200">
            <p className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {result && (
          <section className="bg-zinc-900 rounded-lg p-6 shadow-lg">
            <div className="mb-6 pb-4 border-b border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-green-400">お題</h3>
                <span className="text-sm text-zinc-400">Popularity スコア</span>
              </div>
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold">{result.baseName}</h4>
                <div className="text-xl font-bold">{result.basePop}</div>
              </div>
              <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${result.basePop}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-4">結果ランキング</h3>
              
              <div className="space-y-4">
                {result.results.map((r, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-md ${i === 0 ? 'bg-zinc-800 border-l-4 border-green-500' : 'bg-zinc-800/50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                          i === 0 ? 'bg-green-500 text-black' : 'bg-zinc-700 text-white'
                        } text-xs font-medium`}>
                          {i + 1}
                        </span>
                        <h5 className="font-medium">{r.name}</h5>
                      </div>
                      <div className="text-sm text-zinc-400">
                        差: <span className="font-medium text-white">{r.diff}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="flex-grow mr-2">
                        <div className="w-full bg-zinc-700 rounded-full h-2">
                          <div 
                            className={`${i === 0 ? 'bg-green-500' : 'bg-green-700'} h-2 rounded-full`}
                            style={{ width: `${r.popularity}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{r.popularity}</div>
                    </div>
                  </div>
                ))}
              </div>

              {result.results.length > 0 && (
                <div className="mt-6 p-4 bg-zinc-800 rounded-md border-l-4 border-green-500">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-xs text-green-400 uppercase tracking-wide font-medium">優勝</div>
                      <div className="font-bold">{result.results[0].name}</div>
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