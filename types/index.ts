export type Ranking = {
  name: string
  score: number
  createdAt: any
  mode?: GameMode
  metric?: MetricMode
  genre?: string
  date?: string // YYYY-MM-DD for daily
  gameType?: 'versus' | 'timeline'
  playerId?: string
  region?: 'jp' | 'global'
}

export type GameMode = 'classic' | 'daily' | 'genre' | 'challenge'

export type MetricMode = 'popularity' | 'followers'

export type Artist = {
  id: string
  name: string
  nameJa?: string
  popularity: number
  followers?: number
  genres?: string[]
  imageUrl?: string
}

export type GameResult = {
  theme: string
  themeArtist: Artist
  answer: string
  answerArtist: Artist
  diff: number
  baseScore?: number
  timeBonus?: number
  metric: MetricMode
  hintUsed?: boolean
}

export type GameState = {
  mode: GameMode
  metric: MetricMode
  genre?: string
  rounds: number
  results: GameResult[]
  score: number
  challengeId?: string
}

export type Challenge = {
  id: string
  questions: Artist[]
  metric: MetricMode
  genre?: string
  creatorName: string
  creatorScore: number
  createdAt: any
}

export type DailyChallenge = {
  date: string
  questions: Artist[]
  metric: MetricMode
}

export const GENRE_CATEGORIES = [
  { id: 'rock', label: 'Rock', labelJa: 'ロック', keywords: ['rock', 'punk', 'metal', 'alternative', 'grunge', 'emo'] },
  { id: 'pop', label: 'Pop', labelJa: 'ポップ', keywords: ['pop', 'j-pop', 'k-pop', 'city pop', 'synth-pop', 'electropop'] },
  { id: 'hiphop', label: 'Hip-Hop', labelJa: 'ヒップホップ', keywords: ['hip hop', 'rap', 'trap', 'r&b'] },
  { id: 'electronic', label: 'Electronic', labelJa: 'エレクトロ', keywords: ['electronic', 'edm', 'house', 'techno', 'ambient'] },
  { id: 'idol', label: 'Idol', labelJa: 'アイドル', keywords: ['idol', 'j-idol', 'akb'] },
  { id: 'anime', label: 'Anime', labelJa: 'アニメ', keywords: ['anime', 'vocaloid', 'game'] },
  { id: 'all', label: 'All Genres', labelJa: '全ジャンル', keywords: [] },
] as const

export type GenreCategory = typeof GENRE_CATEGORIES[number]['id']
