'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Suggestion = {
  id: string
  name: string
  genres: string[]
  followers: number
  imageUrl: string | null
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect: (name: string, id?: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function ArtistSearch({ value, onChange, onSelect, placeholder, disabled }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Skip search if we just selected from dropdown
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }

    if (value.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        if (!res.ok) return
        const data = await res.json()
        setSuggestions(data.artists ?? [])
        setShowDropdown(true)
        setSelectedIndex(-1)
      } catch {
        // ignore
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[selectedIndex]
      justSelectedRef.current = true
      onChange(selected.name)
      setSuggestions([])
      setShowDropdown(false)
      onSelect(selected.name, selected.id)
    }
  }

  const handleSelect = (s: Suggestion) => {
    justSelectedRef.current = true
    onChange(s.name)
    setSuggestions([])
    setShowDropdown(false)
    onSelect(s.name, s.id)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && !justSelectedRef.current) setShowDropdown(true)
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-brand transition-all"
        autoFocus
        autoComplete="off"
      />

      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-zinc-800 rounded-lg overflow-hidden shadow-xl border border-zinc-700"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                onClick={() => handleSelect(s)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  i === selectedIndex ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'
                }`}
              >
                {s.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={s.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-600 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{s.name}</span>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
