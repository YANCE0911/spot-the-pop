// lib/sound.ts — Lightweight sound effects using Web Audio API (no external files)

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function isMuted(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('soundiq_muted') === '1'
}

export function setMuted(muted: boolean) {
  localStorage.setItem('soundiq_muted', muted ? '1' : '0')
}

export function getMuted(): boolean {
  return isMuted()
}

// --- Sound generators ---

/** High sparkle for PERFECT */
export function playPerfect() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime

  // Two quick ascending tones
  ;[0, 0.1].forEach((delay, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880 + i * 440
    gain.gain.setValueAtTime(0.3, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + delay)
    osc.stop(now + delay + 0.2)
  })
}

/** Positive ding for GREAT */
export function playGreat() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.2)
}

/** Neutral tone for GOOD/SO SO */
export function playNeutral() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = 440
  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.15)
}

/** Low buzz for MISS */
export function playMiss() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 200
  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

/** Short click for countdown tick */
export function playTick() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 660
  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.08)
}

/** Higher tone for GO! */
export function playGo() {
  if (isMuted()) return
  const ctx = getCtx()
  const now = ctx.currentTime
  ;[0, 0.05].forEach((delay, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1047 + i * 523
    gain.gain.setValueAtTime(0.3, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + delay)
    osc.stop(now + delay + 0.15)
  })
}

/** Play reaction sound based on score tier */
export function playReaction(tier: 'perfect' | 'great' | 'good' | 'soso' | 'miss') {
  switch (tier) {
    case 'perfect': playPerfect(); break
    case 'great': playGreat(); break
    case 'good': case 'soso': playNeutral(); break
    case 'miss': playMiss(); break
  }
}
