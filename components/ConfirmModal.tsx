'use client'

import type { Artist } from '@/types'
import { formatMetricValue } from '@/lib/metrics'

type Props = {
  artist: Artist | null
  onConfirm: () => void
  onCancel: () => void
  lang?: 'en' | 'ja'
}

export default function ConfirmModal({ artist, onConfirm, onCancel, lang = 'en' }: Props) {
  if (!artist) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onCancel}>
      <div
        className="bg-zinc-900 rounded-2xl p-5 max-w-sm w-full space-y-4 animate-[scaleIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-zinc-400 text-sm text-center">
          {lang === 'ja' ? 'このアーティストで回答しますか？' : 'Answer with this artist?'}
        </p>

        <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl">
          {artist.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={artist.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-700 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{artist.name}</div>
            {/* followers hidden to prevent answer leaking */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="text-xs text-zinc-600 truncate">{artist.genres.slice(0, 2).join(', ')}</div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
          >
            {lang === 'ja' ? 'キャンセル' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-brand text-black py-2.5 rounded-lg font-semibold hover:bg-brand-light transition-colors"
          >
            {lang === 'ja' ? '回答する' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
