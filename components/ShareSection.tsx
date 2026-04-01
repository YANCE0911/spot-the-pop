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

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = challengeUrl
    ? `${origin}${challengeUrl}`
    : `${origin}/share?score=${displayScore.toFixed(2)}&mode=${mode}&v=3`

  const shareText = `SOUND IQ - ${modeLabel}\nScore: ${displayScore.toFixed(2)}/100`
  const tweetText = encodeURIComponent(shareText)
  const tweetUrl = encodeURIComponent(shareUrl)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <a
        href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans bg-black border border-zinc-700 text-white py-3 px-4 rounded-lg font-bold hover:bg-zinc-900 transition-all active:scale-[0.98] text-center text-sm"
      >
        X
      </a>
      <button
        onClick={handleCopy}
        className="font-sans py-3 px-4 rounded-lg font-bold transition-all active:scale-[0.98] bg-zinc-800 text-white hover:bg-zinc-700 text-sm"
      >
        {copied ? t('copied', lang) : t('share', lang)}
      </button>

      {challengeUrl && (
        <button
          onClick={async () => {
            const fullUrl = `${window.location.origin}${challengeUrl}`
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="col-span-3 bg-zinc-800 text-white py-3 px-6 rounded-lg font-bold hover:bg-zinc-700 transition-all active:scale-[0.98] text-sm"
        >
          {t('challengeFriend', lang)}
        </button>
      )}
    </>
  )
}
