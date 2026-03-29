'use client'

import type { MetricMode } from '@/types'

type Props = {
  selected: MetricMode
  onSelect: (metric: MetricMode) => void
  lang?: 'en' | 'ja'
}

const metrics: { id: MetricMode; en: string; ja: string; descEn: string; descJa: string }[] = [
  { id: 'popularity', en: 'Popularity', ja: '人気度', descEn: '0-100 score based on streams', descJa: '再生数ベースのスコア (0-100)' },
  { id: 'followers', en: 'Followers', ja: 'フォロワー数', descEn: 'Total Spotify followers', descJa: 'Spotifyフォロワー総数' },
]

export default function MetricSelector({ selected, onSelect, lang = 'en' }: Props) {
  return (
    <div className="flex gap-2">
      {metrics.map(m => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`flex-1 px-4 py-3 rounded-xl text-center transition-all ${
            selected === m.id
              ? 'bg-green-500 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <div className="text-sm font-bold">{lang === 'ja' ? m.ja : m.en}</div>
          <div className={`text-xs mt-0.5 ${selected === m.id ? 'text-black/60' : 'text-zinc-600'}`}>
            {lang === 'ja' ? m.descJa : m.descEn}
          </div>
        </button>
      ))}
    </div>
  )
}
