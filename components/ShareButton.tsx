'use client'

import { useState } from 'react'
import { t, type Lang } from '@/lib/i18n'
import type { GameResult } from '@/types'

type Props = {
  score: number
  mode: string
  metric: string
  results?: GameResult[]
  challengeUrl?: string
  lang?: Lang
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://soundiq.app'

function getRankLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'S', color: 'text-yellow-400' }
  if (score >= 80) return { label: 'A', color: 'text-emerald-400' }
  if (score >= 70) return { label: 'B', color: 'text-sky-400' }
  if (score >= 60) return { label: 'C', color: 'text-zinc-300' }
  if (score >= 50) return { label: 'D', color: 'text-amber-400' }
  return { label: 'E', color: 'text-red-400' }
}

export default function ShareButton({ score, results = [], challengeUrl, lang = 'en' }: Props) {
  const [copied, setCopied] = useState(false)

  const displayScore = Math.round(score * 100) / 100
  const grade = getRankLabel(displayScore)

  const origin = typeof window !== 'undefined' ? window.location.origin : BASE_URL
  const shareUrl = challengeUrl
    ? `${origin}${challengeUrl}`
    : `${BASE_URL}/share?score=${displayScore.toFixed(2)}&mode=versus&v=6`

  const line = '━━━━━━━━━━━━'
  const shareText = `SOUND IQ - VERSUS\n${line}\n${displayScore.toFixed(2)}点\n判定：${grade.label}ランク\n${line}\nあなたの音楽IQは？\n${shareUrl}`

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChallengeLink = async () => {
    if (!challengeUrl) return
    const fullUrl = `${origin}${challengeUrl}`
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 relative">
      {results.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3">
          <p className="text-brand font-bold text-sm tracking-widest uppercase">SOUND IQ</p>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-black text-white">{displayScore.toFixed(2)}</span>
            <span className="text-zinc-500 text-lg">/100</span>
          </div>

          <span className={`inline-block text-2xl font-black ${grade.color}`}>
            {grade.label}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 bg-black border border-zinc-700 text-white py-3 px-4 rounded-xl font-display font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          {t('shareOnX', lang)}
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 bg-brand text-black py-3 px-4 rounded-xl font-display font-bold hover:bg-brand-light transition-all active:scale-[0.98]"
        >
          {copied ? t('copied', lang) : t('share', lang)}
        </button>
      </div>

      {challengeUrl && (
        <button
          onClick={handleChallengeLink}
          className="w-full bg-zinc-800 text-white py-3 px-6 rounded-xl font-display font-bold hover:bg-zinc-700 transition-all active:scale-[0.98]"
        >
          {t('challengeFriend', lang)}
        </button>
      )}

    </div>
  )
}
