'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getTopRankings, getPlayerRank } from '@/lib/ranking'
import { getPlayerId } from '@/lib/playerId'
import type { Ranking } from '@/types'
import { detectLang, type Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'

type Tab = 'versus' | 'timeline'

export default function RankingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('timeline')
  const [versusRankings, setVersusRankings] = useState<Ranking[]>([])
  const [timelineRankings, setTimelineRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [lang] = useState<Lang>(() => detectLang())
  const [playerId, setPlayerId] = useState('')
  const [myVersusRank, setMyVersusRank] = useState<{ rank: number; score: number } | null>(null)
  const [myTimelineRank, setMyTimelineRank] = useState<{ rank: number; score: number } | null>(null)

  useEffect(() => {
    const pid = getPlayerId()
    setPlayerId(pid)

    Promise.all([
      getTopRankings(50, 'versus'),
      getTopRankings(50, 'timeline'),
      getPlayerRank(pid, 'versus'),
      getPlayerRank(pid, 'timeline'),
    ]).then(([v, t, myV, myT]) => {
      setVersusRankings(v)
      setTimelineRankings(t)
      setMyVersusRank(myV)
      setMyTimelineRank(myT)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const rankings = tab === 'versus' ? versusRankings : timelineRankings
  const myRank = tab === 'versus' ? myVersusRank : myTimelineRank
  const isInList = myRank ? myRank.rank <= 50 : false

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
            onClick={() => setTab('timeline')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              tab === 'timeline'
                ? 'bg-accent text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            TIMELINE
          </button>
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
        </div>

        {/* Rankings list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className={`animate-spin h-8 w-8 border-4 rounded-full border-t-transparent ${
              tab === 'versus' ? 'border-brand' : 'border-accent'
            }`} />
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
            {rankings.map((r, i) => {
              const isMe = playerId && r.playerId === playerId
              return (
                <motion.div
                  key={`${r.name}-${r.score}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isMe
                      ? `border-2 ${tab === 'versus' ? 'border-brand bg-brand/10' : 'border-accent bg-accent/10'}`
                      : i < 3 ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-900/50'
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
                    <p className={`font-semibold truncate ${
                      isMe ? (tab === 'versus' ? 'text-brand' : 'text-accent') :
                      i < 3 ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {r.name}
                      {isMe && <span className="text-xs ml-1 opacity-60">YOU</span>}
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
              )
            })}
          </div>
        )}

        {/* Your rank (if outside top 50) */}
        {myRank && !isInList && (
          <div className={`p-4 rounded-xl border-2 ${
            tab === 'versus' ? 'border-brand/50 bg-brand/5' : 'border-accent/50 bg-accent/5'
          }`}>
            <p className="text-zinc-400 text-xs mb-1">
              {lang === 'ja' ? 'あなたの順位' : 'Your Rank'}
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${tab === 'versus' ? 'text-brand' : 'text-accent'}`}>
                #{myRank.rank}
              </span>
              <span className="text-zinc-400 font-mono">
                {myRank.score.toFixed(1)} / 100
              </span>
            </div>
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
