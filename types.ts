export type Player = {
    name: string
    artist: string
    popularity: number
    diff: number
  }
  
  export type Room = {
    id: string
    baseArtist: string
    basePopularity: number
    players: Record<string, Player>
    finished: boolean
  }
  