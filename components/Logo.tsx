'use client'

import { useRouter } from 'next/navigation'

type Props = {
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'md' }: Props) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/')}
      className="flex items-baseline gap-1 group"
    >
      <span className={`bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent hover:from-zinc-100 hover:to-zinc-300 transition-all font-display font-black tracking-tight ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}>
        SOUND IQ
      </span>
    </button>
  )
}
