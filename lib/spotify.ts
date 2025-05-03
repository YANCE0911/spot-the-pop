// lib/spotify.ts
import dotenv from 'dotenv';
dotenv.config(); // ← .env.local 読み込み

export async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log('🟢 使用するクライアントID:', clientId);
  console.log('🟢 クライアントシークレットの有無:', !!clientSecret);

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!data.access_token) {
    console.error('❌ Spotifyからのトークン取得に失敗:', data);
    throw new Error('Failed to retrieve Spotify token');
  }

  return data.access_token;
}
