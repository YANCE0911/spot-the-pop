// types.ts
export type Ranking = {
  name: string
  score: number
  createdAt: any // Timestamp 型を使うなら `import { Timestamp } from 'firebase/firestore'` してもOK
}
