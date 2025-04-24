// app/api/popularity/route.ts
import { NextResponse } from 'next/server'

const client_id = process.env.SPOTIPY_CLIENT_ID!
const client_secret = process.env.SPOTIPY_CLIENT_SECRET!

// トークン取得
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials"
  })

  const data = await res.json()
  return data.access_token
}

// メイン処理
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const artistName = searchParams.get("artist")

  if (!artistName) {
    return NextResponse.json({ error: "artist is required" }, { status: 400 })
  }

  const token = await getAccessToken()

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await res.json()
  const artist = data.artists.items[0]

  if (!artist) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  return NextResponse.json({
    name: artist.name,
    popularity: artist.popularity
  })
}
