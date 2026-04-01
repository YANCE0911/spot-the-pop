'use client'

import { useState } from 'react'
import type { GameResult } from '@/types'

type Props = {
  score: number
  mode: string
  metric: string
  results?: GameResult[]
  challengeUrl?: string
  lang?: 'en' | 'ja'
}

// Total score out of 100
function getScoreGrade(total: number): { label: string; color: string } {
  if (total >= 95) return { label: 'S', color: 'text-brand' }
  if (total >= 85) return { label: 'A', color: 'text-emerald-400' }
  if (total >= 70) return { label: 'B', color: 'text-sky-400' }
  if (total >= 50) return { label: 'C', color: 'text-amber-400' }
  return { label: 'D', color: 'text-red-400' }
}

export default function ShareButton({ score, results = [], challengeUrl, lang = 'en' }: Props) {
  const [copied, setCopied] = useState(false)

  const displayScore = Math.round(score * 100) / 100
  const grade = getScoreGrade(displayScore)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = challengeUrl
    ? `${origin}${challengeUrl}`
    : `${origin}/share?score=${displayScore.toFixed(2)}&mode=versus&v=3`

  const shareText = [
    'SOUND IQ',
    `Score: ${displayScore.toFixed(2)}/100 (${grade.label})`,
  ].join('\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChallengeLink = async () => {
    if (!challengeUrl) return
    const fullUrl = `${window.location.origin}${challengeUrl}`
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
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-black border border-zinc-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center"
        >
          X
        </a>
        <button
          onClick={handleCopy}
          className="flex-1 bg-brand text-black py-3 px-4 rounded-xl font-bold hover:bg-brand-light transition-all active:scale-[0.98]"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {challengeUrl && (
        <button
          onClick={handleChallengeLink}
          className="w-full bg-zinc-800 text-white py-3 px-6 rounded-xl font-bold hover:bg-zinc-700 transition-all active:scale-[0.98]"
        >
          {lang === 'ja' ? 'Challenge Link' : 'Challenge a Friend'}
        </button>
      )}

    </div>
  )
}
