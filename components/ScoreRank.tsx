'use client'

type Props = {
  score: number
  lang?: 'en' | 'ja'
}

// Total score out of 100. K=20 scoring: S=85+, A=65+, B=45+, C=25+, D=<25
function getRank(score: number): { rank: string; color: string; description: string; descriptionJa: string } {
  if (score >= 85) return { rank: 'S', color: 'text-yellow-400', description: 'Legendary!', descriptionJa: '伝説級!' }
  if (score >= 65) return { rank: 'A', color: 'text-green-400', description: 'Excellent!', descriptionJa: '素晴らしい!' }
  if (score >= 45) return { rank: 'B', color: 'text-blue-400', description: 'Great job!', descriptionJa: 'いい感じ!' }
  if (score >= 25) return { rank: 'C', color: 'text-zinc-300', description: 'Not bad', descriptionJa: 'まあまあ' }
  return { rank: 'D', color: 'text-red-400', description: 'Keep trying', descriptionJa: 'もっと聴こう' }
}

export default function ScoreRank({ score, lang = 'en' }: Props) {
  const { rank, color, description, descriptionJa } = getRank(score)

  return (
    <div className="text-center animate-[popIn_0.4s_ease-out_0.3s_both]">
      <div className={`text-7xl font-black ${color}`}>{rank}</div>
      <p className="text-zinc-400 text-sm mt-1">{lang === 'ja' ? descriptionJa : description}</p>
    </div>
  )
}
