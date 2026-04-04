'use client'

type Props = {
  score: number
  lang?: 'en' | 'ja'
}

type RankInfo = { rank: string; color: string; description: string; descriptionJa: string; threshold: number }

const RANKS: RankInfo[] = [
  { rank: 'S', color: 'text-yellow-400', description: 'Legendary!', descriptionJa: '伝説級!', threshold: 90 },
  { rank: 'A', color: 'text-green-400', description: 'Excellent!', descriptionJa: '素晴らしい!', threshold: 80 },
  { rank: 'B', color: 'text-blue-400', description: 'Great job!', descriptionJa: 'いい感じ!', threshold: 70 },
  { rank: 'C', color: 'text-zinc-300', description: 'Not bad!', descriptionJa: 'なかなか!', threshold: 60 },
  { rank: 'D', color: 'text-orange-400', description: 'Almost there!', descriptionJa: 'あと少し!', threshold: 50 },
  { rank: 'E', color: 'text-red-400', description: 'So many hits to discover!', descriptionJa: 'まだ見ぬ名曲がたくさん!', threshold: 0 },
]

function getRank(score: number): RankInfo {
  return RANKS.find(r => score >= r.threshold) ?? RANKS[RANKS.length - 1]
}

function getNextRank(score: number): { nextRank: string; pointsNeeded: number } | null {
  const currentIdx = RANKS.findIndex(r => score >= r.threshold)
  if (currentIdx <= 0) return null // Already S rank
  const next = RANKS[currentIdx - 1]
  return { nextRank: next.rank, pointsNeeded: Math.ceil((next.threshold - score) * 10) / 10 }
}

export default function ScoreRank({ score, lang = 'en' }: Props) {
  const { rank, color, description, descriptionJa } = getRank(score)
  const next = getNextRank(score)

  return (
    <div className="text-center animate-[popIn_0.4s_ease-out_0.3s_both]">
      <div className={`text-7xl font-black ${color}`}>{rank}</div>
      {next && (
        <p className="text-zinc-500 text-xs mt-1">
          {lang === 'ja'
            ? `あと${next.pointsNeeded.toFixed(1)}点で ${next.nextRank} ランク!`
            : `${next.pointsNeeded.toFixed(1)} more points to rank ${next.nextRank}!`
          }
        </p>
      )}
    </div>
  )
}
