'use client'

type Props = {
  genres: string[]
  metricRange: string
  onUseHint: (type: 'genre' | 'range') => void
  usedHints: Set<string>
  lang?: 'en' | 'ja'
}

export default function HintPanel({ genres, metricRange, onUseHint, usedHints, lang = 'en' }: Props) {
  const labels = {
    en: { genre: 'Genre Hint', range: 'Range Hint', used: 'Used' },
    ja: { genre: 'ジャンルヒント', range: '範囲ヒント', used: '使用済' },
  }
  const l = labels[lang]

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onUseHint('genre')}
        disabled={usedHints.has('genre')}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          usedHints.has('genre')
            ? 'bg-zinc-800 text-zinc-400 cursor-default'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        {usedHints.has('genre') ? (
          <span>{genres.slice(0, 2).join(', ') || 'Unknown'}</span>
        ) : (
          <span>{l.genre} <span className="text-zinc-500">(-3)</span></span>
        )}
      </button>

      <button
        onClick={() => onUseHint('range')}
        disabled={usedHints.has('range')}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          usedHints.has('range')
            ? 'bg-zinc-800 text-zinc-400 cursor-default'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        {usedHints.has('range') ? (
          <span>{metricRange}</span>
        ) : (
          <span>{l.range} <span className="text-zinc-500">(-5)</span></span>
        )}
      </button>
    </div>
  )
}
