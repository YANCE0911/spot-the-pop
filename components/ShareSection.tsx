'use client'

import { useState } from 'react'
import { t, type Lang } from '@/lib/i18n'

type Props = {
  score: number
  mode: 'versus' | 'timeline'
  lang?: Lang
  challengeUrl?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://soundiq.vercel.app'

function getRankLabel(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'E'
}

export default function ShareSection({ score, mode, lang = 'en', challengeUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const displayScore = Math.round(score * 100) / 100
  const modeLabel = mode === 'versus' ? 'VERSUS' : 'TIMELINE'
  const rank = getRankLabel(displayScore)

  const origin = typeof window !== 'undefined' ? window.location.origin : BASE_URL
  const shareUrl = challengeUrl
    ? `${origin}${challengeUrl}`
    : `${BASE_URL}/share?score=${displayScore.toFixed(2)}&mode=${mode}&v=4`

  const scoreLine = displayScore >= 70
    ? `${displayScore.toFixed(2)}点で${rank}ランク`
    : `${displayScore.toFixed(2)}点で${rank}ランク...`
  const cta = mode === 'versus'
    ? '音楽好きなら当てられる？'
    : 'あの曲のリリース年、当てられる？'

  const shareText = `SOUND IQ - ${modeLabel}\n${scoreLine}\n${cta}\n${shareUrl}`

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="font-sans bg-black border border-zinc-700 text-white py-3 px-4 rounded-lg font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center text-sm"
      >
        {t('shareOnX', lang)}
      </button>
      <button
        onClick={handleCopy}
        className="font-sans py-3 px-4 rounded-lg font-bold transition-all active:scale-[0.98] bg-zinc-800 text-white hover:bg-zinc-700 text-sm"
      >
        {copied ? t('copied', lang) : t('share', lang)}
      </button>

      {challengeUrl && (
        <button
          onClick={async () => {
            const fullUrl = `${origin}${challengeUrl}`
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="col-span-2 bg-zinc-800 text-white py-3 px-6 rounded-lg font-bold hover:bg-zinc-700 transition-all active:scale-[0.98] text-sm"
        >
          {t('challengeFriend', lang)}
        </button>
      )}
    </>
  )
}
