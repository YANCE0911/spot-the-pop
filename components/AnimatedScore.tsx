'use client'

import { useState, useEffect } from 'react'

type Props = {
  value: number
  duration?: number
}

export default function AnimatedScore({ value, duration = 1200 }: Props) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }

    const start = performance.now()
    let frame: number

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{display}</>
}
