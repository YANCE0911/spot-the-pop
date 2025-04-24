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
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          {/* Spotify風のロゴとタイトル */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="black"/>
                <path d="M16.7999 17.2C16.7999 17.3 16.6999 17.4 16.5999 17.4C14.2999 18.7 11.4999 18.9 8.99992 18.1C8.79992 18.1 8.69992 17.9 8.69992 17.8C8.69992 17.7 8.79992 17.5 8.99992 17.5C11.2999 18.2 13.8999 18 15.9999 16.8C16.0999 16.7 16.2999 16.8 16.2999 16.9C16.7999 17 16.7999 17.1 16.7999 17.2ZM17.7999 14.7C17.7999 14.8 17.6999 14.9 17.5999 15C14.7999 16.5 10.9999 16.8 8.09992 15.8C7.89992 15.7 7.79992 15.6 7.79992 15.4C7.79992 15.2 7.99992 15.1 8.09992 15C11.0999 16 14.6999 15.7 17.2999 14.3C17.4999 14.2 17.6999 14.3 17.6999 14.5C17.7999 14.5 17.7999 14.6 17.7999 14.7ZM17.9999 12.1C17.9999 12.3 17.8999 12.4 17.6999 12.5C14.4999 14.2 9.79992 14.4 7.09992 13.2C6.89992 13.1 6.69992 12.9 6.69992 12.7C6.69992 12.5 6.89992 12.3 7.09992 12.2C9.99992 13.4 14.8999 13.2 18.2999 11.4C18.4999 11.3 18.6999 11.4 18.6999 11.6C18.9999 11.8 18.9999 11.9 17.9999 12.1Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-green-500 tracking-tight">Spotify 人気度バトル</h1>
          </div>
          <p className="text-zinc-400 text-sm mt-2">
            アーティストの人気度を比較して勝者を決めよう
          </p>
        </header>

        <section className="bg-zinc-900 rounded-lg p-6 mb-8">
          <form onSubmit={handleResult} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-500 mb-2">
                お題のアーティスト名
              </label>
              <input
                type="text"
                value={baseArtist}
                onChange={(e) => setBaseArtist(e.target.value)}
                className="w-full p-3 bg-zinc-800 text-white border-none rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="例: ラルク"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-500 mb-2">
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
                    className="w-full p-3 bg-zinc-800 text-white border-none rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder={`プレイヤー${i + 1} のアーティスト名`}
                  />
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
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6 text-red-200">
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
                <h3 className="text-lg font-medium text-green-500">お題</h3>
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
              <h3 className="text-lg font-medium text-green-500 mb-4">結果ランキング</h3>
              
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
                      <div className="text-xs text-green-500 uppercase tracking-wide font-medium">優勝</div>
                      <div className="font-bold">{result.results[0].name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        
        <footer className="mt-10 text-center text-xs text-zinc-600">
          <p>DIGLE MAGAZINE</p>
        </footer>
      </div>
    </main>
  )
}