'use client'

import React, { useState } from 'react'
import './globals.css'

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
    <main className="min-h-screen bg-black text-white px-6 py-14 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="text-center mb-12">
          {/* Spotify風のロゴとタイトル */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="black"/>
                <path d="M16.7999 17.2C16.7999 17.3 16.6999 17.4 16.5999 17.4C14.2999 18.7 11.4999 18.9 8.99992 18.1C8.79992 18.1 8.69992 17.9 8.69992 17.8C8.69992 17.7 8.79992 17.5 8.99992 17.5C11.2999 18.2 13.8999 18 15.9999 16.8C16.0999 16.7 16.2999 16.8 16.2999 16.9C16.7999 17 16.7999 17.1 16.7999 17.2ZM17.7999 14.7C17.7999 14.8 17.6999 14.9 17.5999 15C14.7999 16.5 10.9999 16.8 8.09992 15.8C7.89992 15.7 7.79992 15.6 7.79992 15.4C7.79992 15.2 7.99992 15.1 8.09992 15C11.0999 16 14.6999 15.7 17.2999 14.3C17.4999 14.2 17.6999 14.3 17.6999 14.5C17.7999 14.5 17.7999 14.6 17.7999 14.7ZM17.9999 12.1C17.9999 12.3 17.8999 12.4 17.6999 12.5C14.4999 14.2 9.79992 14.4 7.09992 13.2C6.89992 13.1 6.69992 12.9 6.69992 12.7C6.69992 12.5 6.89992 12.3 7.09992 12.2C9.99992 13.4 14.8999 13.2 18.2999 11.4C18.4999 11.3 18.6999 11.4 18.6999 11.6C18.9999 11.8 18.9999 11.9 17.9999 12.1Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-green-500 text-5xl font-extrabold tracking-tight">Spotify 人気度バトル</h1>
          </div>
          <div className="bg-zinc-800 text-zinc-300 text-sm rounded-md p-4 text-left max-w-xl mx-auto">
            人気度（popularity）はSpotifyの内部指標で、主に再生回数・リスナー数・成長速度などから算出されるスコア（0〜100）です。
          </div>
        </header>

        <form onSubmit={handleResult} className="space-y-8 bg-zinc-900 p-6 rounded-xl shadow-lg ring-1 ring-zinc-800">
          <div>
            <label className="text-green-400 font-semibold text-sm mb-2 block">お題アーティスト</label>
            <input
              type="text"
              value={baseArtist}
              onChange={(e) => setBaseArtist(e.target.value)}
              className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="例：ラルク"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-green-400 font-semibold text-sm">プレイヤーのアーティスト</label>
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
                className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder={`プレイヤー${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-3 rounded-lg font-semibold hover:bg-green-400 transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                検索中...
              </span>
            ) : (
              '結果を見る'
            )}
          </button>
        </form>

        {error && (
          <div className="bg-red-800/80 text-white p-4 rounded-lg shadow ring-1 ring-red-900">
            {error}
          </div>
        )}

        {result && (
          <section className="bg-zinc-900 p-6 rounded-xl shadow-lg ring-1 ring-zinc-800">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-green-500 text-sm font-semibold uppercase tracking-wide mb-1">お題</h2>
                <h3 className="text-2xl font-bold">{result.baseName}</h3>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-sm font-semibold uppercase tracking-wide mb-1">人気度</div>
                <div className="text-2xl font-bold">{result.basePop}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-green-500 text-sm font-semibold uppercase tracking-wide mb-3">結果ランキング</h3>
              <ul className="space-y-3">
                {result.results.map((r, i) => (
                  <li
                    key={i}
                    className={`flex justify-between items-center p-4 rounded-lg ${i === 0 ? 'bg-green-600 text-black' : 'bg-zinc-800 text-white'}`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 ${
                        i === 0 ? 'bg-black text-green-500' : 'bg-zinc-700 text-white'
                      } text-xs font-medium`}>
                        {i + 1}
                      </span>
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="text-sm">
                      差 <span className="font-bold">{r.diff}</span> | 人気度 <span className="font-bold">{r.popularity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {result.results.length > 0 && (
              <div className="mt-8 pt-4 border-t border-zinc-800">
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
          </section>
        )}
        
        <footer className="text-center text-xs text-zinc-600 mt-10">
          <p>DIGLE MAGAZINE</p>
        </footer>
      </div>
    </main>
  )
}