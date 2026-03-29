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

// Per-question score is 0–20, shown as bar ▓▓▓▓░░░░░░
function scoreToBar(diff: number): string {
  const filled = Math.round((diff / 20) * 10)
  return '▓'.repeat(filled) + '░'.repeat(10 - filled)
}

function generateScorePattern(results: GameResult[]): string {
  return results.map((r, i) => `${i + 1} ${scoreToBar(r.diff)}`).join('\n')
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
  const pattern = results.length > 0 ? generateScorePattern(results) : ''
  const grade = getScoreGrade(displayScore)

  const shareText = [
    'SPOT THE POP',
    `Score: ${displayScore.toFixed(2)}/100 (${grade.label})`,
    pattern,
    '',
  ].filter(Boolean).join('\n')

  const handleShare = async () => {
    const url = challengeUrl ? `${window.location.origin}${challengeUrl}` : window.location.origin
    const text = `${shareText}\n${url}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'SPOT THE POP', text, url })
        return
      } catch { /* cancelled */ }
    }

    await navigator.clipboard.writeText(text)
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
          <p className="text-brand font-bold text-sm tracking-widest uppercase">SPOT THE POP</p>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-black text-white">{displayScore.toFixed(2)}</span>
            <span className="text-zinc-500 text-lg">/100</span>
          </div>

          <span className={`inline-block text-2xl font-black ${grade.color}`}>
            {grade.label}
          </span>

          <pre className="text-xs font-mono text-zinc-400 whitespace-pre text-left inline-block">{pattern}</pre>
        </div>
      )}

      <button
        onClick={handleShare}
        className="w-full bg-brand text-black py-3 px-6 rounded-xl font-bold hover:bg-brand-light transition-all active:scale-[0.98]"
      >
        {lang === 'ja' ? 'Share' : 'Share Result'}
      </button>

      {challengeUrl && (
        <button
          onClick={handleChallengeLink}
          className="w-full bg-zinc-800 text-white py-3 px-6 rounded-xl font-bold hover:bg-zinc-700 transition-all active:scale-[0.98]"
        >
          {lang === 'ja' ? 'Challenge Link' : 'Challenge a Friend'}
        </button>
      )}

      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand text-black px-3 py-1 rounded text-sm font-medium animate-[fadeInUp_0.2s_ease-out]">
          {lang === 'ja' ? 'Copied!' : 'Copied!'}
        </div>
      )}
    </div>
  )
}
