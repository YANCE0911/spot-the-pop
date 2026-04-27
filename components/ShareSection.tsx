'use client'

import { useState } from 'react'
import { t, type Lang } from '@/lib/i18n'

type Props = {
  score: number
  mode: 'versus' | 'timeline'
  lang?: Lang
  challengeUrl?: string
  artistName?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://soundiq.app'

function getRankLabel(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'E'
}

export default function ShareSection({ score, mode, lang = 'en', challengeUrl, artistName }: Props) {
  const [copied, setCopied] = useState(false)

  const displayScore = Math.round(score * 100) / 100
  const modeLabel = artistName ? `WHEN? - ${artistName}` : mode === 'versus' ? 'WHO?' : 'WHEN?'
  const rank = getRankLabel(displayScore)

  const origin = typeof window !== 'undefined' ? window.location.origin : BASE_URL
  const shareUrl = challengeUrl
    ? `${origin}${challengeUrl}`
    : `${BASE_URL}/share?score=${displayScore.toFixed(2)}&mode=${mode}${artistName ? `&artist=${encodeURIComponent(artistName)}` : ''}&v=6`

  const line = '━━━━━━━━━━━━'
  const shareText = artistName
    ? `${artistName}で${displayScore.toFixed(2)}点｜SOUND IQ\n${line}\n判定：${rank}ランク\n${line}\nあなたは何点？\n${shareUrl}\ncreated by YANCE`
    : `SOUND IQ - ${modeLabel}\n${line}\n${displayScore.toFixed(2)}点\n判定：${rank}ランク\n${line}\nあなたの音楽IQは？\n${shareUrl}\ncreated by YANCE`

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
        className="font-display bg-black border border-zinc-700 text-white py-3 px-4 rounded-lg font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center text-sm flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        {t('shareOnX', lang)}
      </button>
      <button
        onClick={handleCopy}
        className="font-display py-3 px-4 rounded-lg font-bold transition-all active:scale-[0.98] bg-zinc-700 text-white hover:bg-zinc-600 text-sm"
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
          className="col-span-2 bg-zinc-800 text-white py-3 px-6 rounded-lg font-display font-bold hover:bg-zinc-700 transition-all active:scale-[0.98] text-sm"
        >
          {t('challengeFriend', lang)}
        </button>
      )}
    </>
  )
}
