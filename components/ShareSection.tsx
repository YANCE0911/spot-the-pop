'use client'

import { useState } from 'react'
import { t, type Lang } from '@/lib/i18n'

type Props = {
  score: number
  mode: 'versus' | 'timeline'
  lang?: Lang
  challengeUrl?: string
}

export default function ShareSection({ score, mode, lang = 'en', challengeUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const displayScore = Math.round(score * 100) / 100
  const modeLabel = mode === 'versus' ? 'VERSUS' : 'TIMELINE'

  const shareUrl = challengeUrl
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${challengeUrl}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/share?score=${displayScore.toFixed(2)}&mode=${mode}`

  const shareText = `SOUND IQ - ${modeLabel}\nScore: ${displayScore.toFixed(2)}/100`
  const tweetText = encodeURIComponent(shareText)
  const tweetUrl = encodeURIComponent(shareUrl)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-black border border-zinc-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center"
        >
          X
        </a>
        <button
          onClick={handleCopy}
          className="flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-[0.98] bg-zinc-800 text-white hover:bg-zinc-700"
        >
          {copied ? t('copied', lang) : t('share', lang)}
        </button>
      </div>

      {challengeUrl && (
        <button
          onClick={async () => {
            const fullUrl = `${window.location.origin}${challengeUrl}`
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="w-full bg-zinc-800 text-white py-3 px-6 rounded-xl font-bold hover:bg-zinc-700 transition-all active:scale-[0.98]"
        >
          {t('challengeFriend', lang)}
        </button>
      )}
    </div>
  )
}
