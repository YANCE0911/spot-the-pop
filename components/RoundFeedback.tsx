'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameResult } from '@/types'
import { formatMetricValue } from '@/lib/metrics'
import { playReaction } from '@/lib/sound'

type Props = {
  result: GameResult | null
  onDismiss: () => void
  lang?: 'en' | 'ja'
}

// Score per question is 0–20 (K=20). 5-tier reactions.
// PERFECT: ~1.3x (≥18), GREAT: ~2x (≥14), GOOD: ~3x (≥10), SO SO: ~5x (≥5), MISS: 5x+ (<5)
function getReaction(score: number): { label: string; color: string } {
  if (score >= 18) return { label: 'PERFECT!!!', color: 'text-pink-400' }
  if (score >= 14) return { label: 'GREAT!!', color: 'text-orange-400' }
  if (score >= 10) return { label: 'GOOD!', color: 'text-yellow-400' }
  if (score >= 5) return { label: 'SO SO', color: 'text-emerald-400' }
  return { label: 'MISS...', color: 'text-blue-400' }
}

export default function RoundFeedback({ result, onDismiss, lang = 'en' }: Props) {
  if (!result) return null

  const reaction = getReaction(result.diff)

  // Play sound effect on mount
  useEffect(() => {
    const score = result.diff
    if (score >= 18) playReaction('perfect')
    else if (score >= 14) playReaction('great')
    else if (score >= 10) playReaction('good')
    else if (score >= 5) playReaction('soso')
    else playReaction('miss')
  }, [result.diff])
  const themeVal = result.metric === 'followers'
    ? (result.themeArtist.followers ?? 0) : result.themeArtist.popularity
  const answerVal = result.metric === 'followers'
    ? (result.answerArtist.followers ?? 0) : result.answerArtist.popularity

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full text-center space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            className={`text-4xl font-display font-black ${reaction.color}`}
          >
            {reaction.label}
          </motion.div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800 p-3 rounded-lg">
              <p className="text-zinc-500 text-xs mb-1">{lang === 'ja' ? 'お題' : 'Target'}</p>
              <p className="font-semibold truncate">{result.themeArtist.name}</p>
              <p className="text-brand font-mono text-xs">{formatMetricValue(themeVal, result.metric)}</p>
            </div>
            <div className="bg-zinc-800 p-3 rounded-lg">
              <p className="text-zinc-500 text-xs mb-1">{lang === 'ja' ? '回答' : 'Answer'}</p>
              <p className="font-semibold truncate">{result.answerArtist.name}</p>
              <p className="text-blue-400 font-mono text-xs">{formatMetricValue(answerVal, result.metric)}</p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-full bg-brand text-black py-2.5 rounded-lg font-semibold hover:bg-brand-light transition-all"
          >
            {lang === 'ja' ? '次へ' : 'Next'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
