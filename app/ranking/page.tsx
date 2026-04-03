'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getTopRankings, getSeasonRankings, getPlayerRank, getCurrentSeasonNumber, getSeasonLabel, getPastSeasons } from '@/lib/ranking'
import { getPlayerId } from '@/lib/playerId'
import type { Ranking, Difficulty } from '@/types'
import { detectLang, type Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'

type Tab = 'versus' | 'timeline'

export default function RankingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Tab>('timeline')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [rankings, setRankings] = useState<Record<string, Ranking[]>>({})
  const [myRanks, setMyRanks] = useState<Record<string, { rank: number; score: number } | null>>({})
  const [loading, setLoading] = useState(true)
  const [lang] = useState<Lang>(() => detectLang())
  const [playerId, setPlayerId] = useState('')

  const currentSeason = getCurrentSeasonNumber()
  const [viewingSeason, setViewingSeason] = useState(currentSeason)
  const [showPastSeasons, setShowPastSeasons] = useState(false)
  const pastSeasons = getPastSeasons(lang)
  const isCurrentSeason = viewingSeason === currentSeason

  const region = 'jp' as const
  const rankingKey = `${mode}-${difficulty}`

  useEffect(() => {
    const pid = getPlayerId()
    setPlayerId(pid)
    setLoading(true)

    const fetchFn = isCurrentSeason ? getTopRankings : (count: number, gt: 'versus' | 'timeline', r: 'jp' | 'global', d: Difficulty) => getSeasonRankings(viewingSeason, count, gt, r, d)

    Promise.all([
      fetchFn(50, 'timeline', region, 'easy'),
      fetchFn(50, 'timeline', region, 'hard'),
      fetchFn(50, 'versus', region, 'easy'),
      fetchFn(50, 'versus', region, 'hard'),
      ...(isCurrentSeason ? [
        getPlayerRank(pid, 'timeline', region, 'easy'),
        getPlayerRank(pid, 'timeline', region, 'hard'),
        getPlayerRank(pid, 'versus', region, 'easy'),
        getPlayerRank(pid, 'versus', region, 'hard'),
      ] : []),
    ]).then(([te, th, ve, vh, myTE, myTH, myVE, myVH]) => {
      setRankings({
        'timeline-easy': te, 'timeline-hard': th,
        'versus-easy': ve, 'versus-hard': vh,
      })
      if (isCurrentSeason) {
        setMyRanks({
          'timeline-easy': myTE ?? null, 'timeline-hard': myTH ?? null,
          'versus-easy': myVE ?? null, 'versus-hard': myVH ?? null,
        })
      } else {
        setMyRanks({})
      }
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [viewingSeason, isCurrentSeason])

  const activeRankings = rankings[rankingKey] ?? []
  const myRank = myRanks[rankingKey] ?? null
  const isInList = myRank ? myRank.rank <= 50 : false
  const accentColor = mode === 'versus' ? 'brand' : 'accent'

  return (
    <main className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <Logo size="sm" />
            <p className="text-zinc-500 text-xs mt-0.5">
              {lang === 'ja' ? 'ランキング' : 'Leaderboard'}
            </p>
          </div>
        </header>

        {/* Season selector */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">
              {isCurrentSeason ? (lang === 'ja' ? '現在のシーズン' : 'Current Season') : (lang === 'ja' ? '過去のシーズン' : 'Past Season')}
            </p>
            <p className="text-lg font-bold">
              Season {viewingSeason}
              <span className="text-zinc-400 text-sm font-normal ml-2">{getSeasonLabel(viewingSeason, lang)}</span>
            </p>
          </div>
          {pastSeasons.length > 0 && (
            <button
              onClick={() => setShowPastSeasons(!showPastSeasons)}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showPastSeasons ? (lang === 'ja' ? '閉じる' : 'Close') : (lang === 'ja' ? '過去' : 'History')}
            </button>
          )}
        </div>

        {showPastSeasons && (
          <div className="bg-zinc-900 rounded-xl p-3 space-y-1">
            <button
              onClick={() => { setViewingSeason(currentSeason); setShowPastSeasons(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isCurrentSeason ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              Season {currentSeason} — {getSeasonLabel(currentSeason, lang)}
              <span className="text-xs text-zinc-500 ml-2">{lang === 'ja' ? '(現在)' : '(current)'}</span>
            </button>
            {pastSeasons.map(s => (
              <button
                key={s.num}
                onClick={() => { setViewingSeason(s.num); setShowPastSeasons(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewingSeason === s.num ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                Season {s.num} — {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Game mode + difficulty — 2x2 grid, always visible */}
        <div>
          {/* Mode row */}
          <div className="flex">
            <button
              onClick={() => setMode('timeline')}
              className={`flex-1 pb-2.5 text-sm font-bold transition-all ${
                mode === 'timeline' ? 'text-accent' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              TIMELINE
            </button>
            <button
              onClick={() => setMode('versus')}
              className={`flex-1 pb-2.5 text-sm font-bold transition-all ${
                mode === 'versus' ? 'text-brand' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              VERSUS
            </button>
          </div>
          {/* Difficulty row — grouped under each mode */}
          <div className="flex mt-2">
            <div className="flex-1 flex justify-center gap-6">
              <button
                onClick={() => { setMode('timeline'); setDifficulty('easy') }}
                className={`w-16 text-center pb-1.5 text-xs font-bold transition-all border-b-2 ${
                  mode === 'timeline' && difficulty === 'easy'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                NORMAL
              </button>
              <button
                onClick={() => { setMode('timeline'); setDifficulty('hard') }}
                className={`w-16 text-center pb-1.5 text-xs font-bold transition-all border-b-2 ${
                  mode === 'timeline' && difficulty === 'hard'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                HARD
              </button>
            </div>
            <div className="flex-1 flex justify-center gap-6">
              <button
                onClick={() => { setMode('versus'); setDifficulty('easy') }}
                className={`w-16 text-center pb-1.5 text-xs font-bold transition-all border-b-2 ${
                  mode === 'versus' && difficulty === 'easy'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                NORMAL
              </button>
              <button
                onClick={() => { setMode('versus'); setDifficulty('hard') }}
                className={`w-16 text-center pb-1.5 text-xs font-bold transition-all border-b-2 ${
                  mode === 'versus' && difficulty === 'hard'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                HARD
              </button>
            </div>
          </div>
        </div>

        {/* Rankings list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className={`animate-spin h-8 w-8 border-4 rounded-full border-t-transparent ${
              accentColor === 'brand' ? 'border-brand' : 'border-accent'
            }`} />
          </div>
        ) : activeRankings.length === 0 ? (
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
            {activeRankings.map((r, i) => {
              const isMe = playerId && r.playerId === playerId
              return (
                <motion.div
                  key={`${r.name}-${r.score}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isMe
                      ? `border-2 ${accentColor === 'brand' ? 'border-brand bg-brand/10' : 'border-accent bg-accent/10'}`
                      : i < 3 ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-900/50'
                  }`}
                >
                  <div className={`w-8 text-center font-black text-lg ${
                    i === 0 ? 'text-yellow-400' :
                    i === 1 ? 'text-zinc-300' :
                    i === 2 ? 'text-amber-600' :
                    'text-zinc-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      isMe ? (accentColor === 'brand' ? 'text-brand' : 'text-accent') :
                      i < 3 ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {r.name}
                      {isMe && <span className="text-xs ml-1 opacity-60">YOU</span>}
                    </p>
                  </div>
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
        {isCurrentSeason && myRank && !isInList && (
          <div className={`p-4 rounded-xl border-2 ${
            accentColor === 'brand' ? 'border-brand/50 bg-brand/5' : 'border-accent/50 bg-accent/5'
          }`}>
            <p className="text-zinc-400 text-xs mb-1">
              {lang === 'ja' ? 'あなたの順位' : 'Your Rank'}
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${accentColor === 'brand' ? 'text-brand' : 'text-accent'}`}>
                #{myRank.rank}
              </span>
              <span className="text-zinc-400 font-mono">
                {myRank.score.toFixed(1)} / 100
              </span>
            </div>
          </div>
        )}

        {/* Play button */}
        {isCurrentSeason && (
          <button
            onClick={() => router.push(
              mode === 'versus'
                ? `/game?difficulty=${difficulty}`
                : `/year?difficulty=${difficulty}`
            )}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              accentColor === 'brand'
                ? 'bg-brand text-black hover:bg-brand-light'
                : 'bg-accent text-black hover:brightness-110'
            }`}
          >
            {mode === 'versus'
              ? (lang === 'ja' ? 'VERSUS をプレイ' : 'Play VERSUS')
              : (lang === 'ja' ? 'TIMELINE をプレイ' : 'Play TIMELINE')
            }
          </button>
        )}

        {!isCurrentSeason && (
          <button
            onClick={() => setViewingSeason(currentSeason)}
            className="w-full py-3 rounded-lg font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-all"
          >
            {lang === 'ja' ? '現在のシーズンに戻る' : 'Back to current season'}
          </button>
        )}
      </div>
    </main>
  )
}
