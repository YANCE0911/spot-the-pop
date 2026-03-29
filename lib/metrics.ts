// lib/metrics.ts
import type { MetricMode, Artist } from '@/types'

// === Scoring Constants ===
// 5 questions × 20 pts = 100 max. Display with 2 decimal places.
// Log-ratio: score = max(0, 20 - K * |log10(theme) - log10(answer)|)
// K=10 → same=20, 2x diff≈17, 5x≈13, 10x=10, 50x≈3, 100x=0
export const POINTS_PER_QUESTION = 20
export const SCORE_K = 10

export function getMetricValue(artist: Artist, metric: MetricMode): number {
  switch (metric) {
    case 'followers':
      return artist.followers ?? 0
    // Popularity mode: soft-deleted, hidden from UI. Code kept for future reactivation.
    case 'popularity':
      return artist.popularity
    default:
      return artist.followers ?? 0
  }
}

export function getMetricLabel(metric: MetricMode, lang: 'en' | 'ja' = 'en'): string {
  const labels: Record<MetricMode, { en: string; ja: string }> = {
    popularity: { en: 'Popularity', ja: '人気度' },
    followers: { en: 'Followers', ja: 'フォロワー数' },
  }
  return labels[metric]?.[lang] ?? metric
}

export function formatMetricValue(value: number, metric: MetricMode): string {
  switch (metric) {
    case 'followers':
      return value.toLocaleString()
    // Popularity mode: soft-deleted
    case 'popularity':
      return String(value)
    default:
      return value.toLocaleString()
  }
}

/**
 * Calculate round score (0–20, higher is better, decimal precision)
 * Log-ratio: score = max(0, 20 - K * |log10(theme) - log10(answer)|)
 * Same = 20, 2x diff ≈ 17, 10x = 10, 100x diff = 0
 */
export function calculateScore(themeValue: number, answerValue: number, _metric: MetricMode): number {
  const safeTheme = Math.max(1, themeValue)
  const safeAnswer = Math.max(1, answerValue)
  const logDiff = Math.abs(Math.log10(safeTheme) - Math.log10(safeAnswer))
  return Math.max(0, POINTS_PER_QUESTION - SCORE_K * logDiff)
}

export function getHintRange(value: number, metric: MetricMode): string {
  switch (metric) {
    case 'popularity': {
      // Soft-deleted
      const low = Math.floor(value / 10) * 10
      return `${low}-${low + 10}`
    }
    case 'followers': {
      if (value >= 10_000_000) return '10M+'
      if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M-${Math.floor(value / 1_000_000) + 1}M`
      if (value >= 100_000) return `${Math.floor(value / 100_000) * 100}K-${(Math.floor(value / 100_000) + 1) * 100}K`
      if (value >= 10_000) return `${Math.floor(value / 10_000) * 10}K-${(Math.floor(value / 10_000) + 1) * 10}K`
      return '< 10K'
    }
    default:
      return '?'
  }
}
