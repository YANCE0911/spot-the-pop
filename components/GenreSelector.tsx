'use client'

import { GENRE_CATEGORIES, type GenreCategory } from '@/types'

type Props = {
  onSelect: (genre: GenreCategory) => void
  lang?: 'en' | 'ja'
}

export default function GenreSelector({ onSelect, lang = 'en' }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {GENRE_CATEGORIES.map((genre, i) => (
        <button
          key={genre.id}
          onClick={() => onSelect(genre.id)}
          className="bg-zinc-900 border border-zinc-800 hover:border-brand hover:scale-105 active:scale-95 rounded-xl px-4 py-3 text-center transition-all animate-[fadeInUp_0.3s_ease-out]"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
        >
          <div className="text-sm font-semibold text-white">
            {lang === 'ja' ? genre.labelJa : genre.label}
          </div>
        </button>
      ))}
    </div>
  )
}
