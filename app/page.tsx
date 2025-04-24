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

  // 人気度をビジュアル表示するためのヘルパー関数
  const getPopularityBar = (popularity: number) => {
    return (
      <div className="w-full bg-zinc-800 rounded-full h-2.5 mt-1">
        <div 
          className="bg-gradient-to-r from-green-500 to-green-300 h-2.5 rounded-full" 
          style={{ width: `${popularity}%` }}
        ></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-10">
          <div className="w-12 h-12 mr-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="black"/>
              <path d="M16.5 12.25C14.9 11.25 13 11 11.5 11.25C10 11.5 8.5 12.25 7.5 13.5C7.25 14 7.25 14.5 7.5 15C7.75 15.5 8.25 15.75 8.75 15.75C9 15.75 9.25 15.75 9.5 15.5C10.25 14.75 11.25 14.25 12.25 14.25C13.25 14.25 14.25 14.5 15.25 15C15.5 15.25 15.75 15.25 16 15.25C16.5 15.25 16.75 15 17 14.5C17.25 14 17 13.5 16.5 12.25ZM18 10C15.75 8.75 13.5 8.25 11 8.75C8.75 9.25 7 10.25 5.75 12C5.25 12.75 5.25 13.75 5.75 14.5C6.25 15.25 7.25 15.75 8 15.75C8.5 15.75 9 15.5 9.5 15.25C10.5 14.25 12 13.75 13.25 13.75C14.75 13.75 16.25 14.25 17.5 15C17.75 15.25 18.25 15.25 18.75 15.25C19.5 15.25 20.25 14.75 20.75 14C21.25 13.25 21.25 12.25 20.75 11.5C20 10.75 19 10.25 18 10Z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text">
            SPOTIFY 人気度バトル
          </h1>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-zinc-800">
          <form onSubmit={handleResult} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-green-400 mb-2">お題のアーティスト</label>
              <div className="relative">
                <input
                  type="text"
                  value={baseArtist}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseArtist(e.target.value)}
                  className="w-full p-4 pl-12 bg-zinc-800/70 text-white border border-zinc-700 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none transition duration-200"
                  placeholder="例: ラルク"
                  required
                />
                <svg className="w-6 h-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                プレイヤーのアーティスト入力
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((p, i) => (
                  <div key={i} className="relative">
                    <input
                      type="text"
                      value={p}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const copy = [...players]
                        copy[i] = e.target.value
                        setPlayers(copy)
                      }}
                      className="w-full p-4 pl-12 bg-zinc-800/70 text-white border border-zinc-700 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none transition duration-200"
                      placeholder={`プレイヤー${i + 1} のアーティスト名`}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-green-400/20 text-green-300 font-bold text-sm">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold rounded-xl hover:from-green-400 hover:to-green-500 transition duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  取得中...
                </>
              ) : (
                <>
                  結果を表示
                  <svg className="ml-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-700 p-4 rounded-xl text-red-200 flex items-center">
            <svg className="w-6 h-6 mr-3 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 bg-zinc-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-zinc-700">
              <div>
                <div className="text-sm uppercase tracking-wider text-green-400 font-medium mb-1">お題</div>
                <h3 className="text-2xl font-bold">{result.baseName}</h3>
              </div>
              <div className="mt-3 md:mt-0">
                <div className="text-sm text-zinc-400 mb-1">Popularity スコア</div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold mr-2">{result.basePop}</span>
                  <span className="text-sm text-zinc-400">/100</span>
                </div>
                {getPopularityBar(result.basePop)}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-green-300 flex items-center">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                結果ランキング
              </h4>
              
              <div className="space-y-3">
                {result.results.map((r, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl transition-all ${
                      i === 0 
                        ? 'bg-gradient-to-r from-green-900/30 to-green-700/20 border border-green-700/50' 
                        : 'bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          i === 0 
                            ? 'bg-green-400 text-black' 
                            : 'bg-zinc-700 text-white'
                        }`}>
                          {i + 1}
                        </div>
                        <h5 className={`font-bold text-lg ${i === 0 ? 'text-green-300' : 'text-white'}`}>
                          {r.name}
                        </h5>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-zinc-400">人気度の差</div>
                        <div className={`font-bold ${i === 0 ? 'text-green-400' : 'text-white'}`}>
                          {r.diff}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-full mr-4">
                        {getPopularityBar(r.popularity)}
                      </div>
                      <div className="text-lg font-semibold whitespace-nowrap">{r.popularity}</div>
                    </div>
                  </div>
                ))}
              </div>

              {result.results.length > 0 && (
                <div className="mt-6 p-5 bg-gradient-to-r from-green-900/40 to-green-700/20 rounded-xl border border-green-600/40">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 mr-3 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-sm uppercase tracking-wider text-green-400 font-medium">優勝</div>
                      <h3 className="text-2xl font-bold text-white">{result.results[0].name}</h3>
                    </div>
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