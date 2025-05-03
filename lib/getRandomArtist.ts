// lib/getRandomArtist.ts
import { LARGE_JAPANESE_ARTISTS } from './JapaneseArtists'

export async function getRandomArtist(count = 10) {
  // ランダムにシャッフル
  const shuffled = [...LARGE_JAPANESE_ARTISTS].sort(() => 0.5 - Math.random())

  // 上位から指定数だけ取り出す（人気度はもともと入ってる）
  return shuffled.slice(0, count)
}
