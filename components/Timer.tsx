'use client'

import { useState, useEffect } from 'react'

type Props = {
  duration: number
  onTimeout: () => void
  isRunning: boolean
}

export default function Timer({ duration, onTimeout, isRunning }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration])

  const isExpired = timeLeft <= 0

  useEffect(() => {
    if (!isRunning || isExpired) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isExpired, onTimeout])

  const progress = timeLeft / duration
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const isWarning = timeLeft <= 10

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="4"
        />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={isWarning ? '#ef4444' : '#22c55e'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-lg ${isWarning ? 'text-red-500' : 'text-white'}`}>
        {timeLeft}
      </div>
    </div>
  )
}
