'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { detectLang, type Lang } from '@/lib/i18n'

const SEASONS = [
  {
    id: 'current',
    label: 'SEASON 1',
    desc: { ja: 'フォロワー数マッチ（100点満点）', en: 'Follower match (out of 100)' },
    period: { ja: '2026/3/29〜', en: '2026/3/29 -' },
    status: 'active' as const,
  },
  {
    id: 'season0',
    label: 'SEASON 0',
    desc: { ja: '人気度スコア（低いほど上位）', en: 'Popularity score (lower is better)' },
    period: { ja: '〜2026/3/28', en: '- 2026/3/28' },
    status: 'ended' as const,
  },
]

export default function HallOfFamePage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')
  useEffect(() => { setLang(detectLang()) }, [])

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-8">
        <header className="text-center animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-brand text-2xl font-bold">
            {lang === 'ja' ? '歴代ランキング' : 'Hall of Fame'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {lang === 'ja' ? '各シーズンの記録' : 'Records from each season'}
          </p>
        </header>

        <div className="space-y-3">
          {SEASONS.map((season, i) => (
            <button
              key={season.id}
              onClick={() => router.push(
                season.status === 'active' ? '/ranking' : `/ranking/history/${season.id}`
              )}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-brand/50 p-5 rounded-xl text-left transition-all animate-[fadeInUp_0.4s_ease-out]"
              style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{season.label}</span>
                    {season.status === 'active' && (
                      <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full font-semibold">
                        {lang === 'ja' ? '開催中' : 'ACTIVE'}
                      </span>
                    )}
                    {season.status === 'ended' && (
                      <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                        {lang === 'ja' ? '終了' : 'ENDED'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{season.desc[lang]}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{season.period[lang]}</p>
                </div>
                <span className="text-zinc-600 text-lg">&rsaquo;</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-zinc-800 text-white py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
        >
          {lang === 'ja' ? 'トップに戻る' : 'Back to Top'}
        </button>
      </div>
    </main>
  )
}
