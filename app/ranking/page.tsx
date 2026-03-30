'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getTopRankings } from '@/lib/ranking'
import type { Ranking } from '@/types'
import { detectLang, type Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'

type Tab = 'versus' | 'timeline'

export default function RankingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('versus')
  const [versusRankings, setVersusRankings] = useState<Ranking[]>([])
  const [timelineRankings, setTimelineRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [lang] = useState<Lang>(() => detectLang())

  useEffect(() => {
    Promise.all([
      getTopRankings(20, 'versus'),
      getTopRankings(20, 'timeline'),
    ]).then(([v, t]) => {
      setVersusRankings(v)
      setTimelineRankings(t)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const rankings = tab === 'versus' ? versusRankings : timelineRankings

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <Logo size="sm" />
            <p className="text-zinc-500 text-xs mt-0.5">
              {lang === 'ja' ? 'ランキング' : 'Leaderboard'}
            </p>
          </div>
        </header>

        {/* Tab switcher */}
        <div className="flex bg-zinc-900 rounded-lg p-1">
          <button
            onClick={() => setTab('versus')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              tab === 'versus'
                ? 'bg-brand text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            VERSUS
          </button>
          <button
            onClick={() => setTab('timeline')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              tab === 'timeline'
                ? 'bg-accent text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            TIMELINE
          </button>
        </div>

        {/* Rankings list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brand rounded-full border-t-transparent" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">
              {lang === 'ja' ? 'まだランキングがありません' : 'No rankings yet'}
            </p>
            <p className="text-zinc-600 text-sm mt-1">
              {lang === 'ja' ? 'プレイしてランキングに登録しよう！' : 'Play and register your score!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <motion.div
                key={`${r.name}-${r.score}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  i < 3 ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-900/50'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 text-center font-black text-lg ${
                  i === 0 ? 'text-yellow-400' :
                  i === 1 ? 'text-zinc-300' :
                  i === 2 ? 'text-amber-600' :
                  'text-zinc-600'
                }`}>
                  {i + 1}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${i < 3 ? 'text-white' : 'text-zinc-300'}`}>
                    {r.name}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono font-bold ${
                    i === 0 ? 'text-yellow-400 text-lg' :
                    i < 3 ? 'text-white' :
                    'text-zinc-400'
                  }`}>
                    {r.score.toFixed(1)}
                  </p>
                  <p className="text-zinc-600 text-[10px]">/ 100</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Play button */}
        <button
          onClick={() => router.push(tab === 'versus' ? '/game' : '/year')}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            tab === 'versus'
              ? 'bg-brand text-black hover:bg-brand-light'
              : 'bg-accent text-black hover:brightness-110'
          }`}
        >
          {tab === 'versus'
            ? (lang === 'ja' ? 'VERSUS をプレイ' : 'Play VERSUS')
            : (lang === 'ja' ? 'TIMELINE をプレイ' : 'Play TIMELINE')
          }
        </button>
      </div>
    </main>
  )
}
