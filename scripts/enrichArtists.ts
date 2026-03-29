// scripts/enrichArtists.ts — Add followers, genres, imageUrl to static artist list
import dotenv from 'dotenv';
dotenv.config();
if (!process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIPY_CLIENT_ID) {
  process.env.SPOTIFY_CLIENT_ID = process.env.SPOTIPY_CLIENT_ID;
}
if (!process.env.SPOTIFY_CLIENT_SECRET && process.env.SPOTIPY_CLIENT_SECRET) {
  process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIPY_CLIENT_SECRET;
}

import { getSpotifyToken } from '../lib/spotify';
import { LARGE_JAPANESE_ARTISTS } from '../lib/JapaneseArtists';
import fs from 'fs';
import path from 'path';

type EnrichedArtist = {
  name: string;
  id: string;
  popularity: number;
  followers: number;
  genres: string[];
  imageUrl?: string;
  nameJa?: string;
};

async function fetchBatch(ids: string[], token: string): Promise<Map<string, any>> {
  const map = new Map();
  // Spotify allows max 50 IDs per request
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      continue;
    }
    const data = await res.json();
    for (const a of data.artists ?? []) {
      if (a) map.set(a.id, a);
    }
  }
  return map;
}

async function main() {
  const token = await getSpotifyToken();
  const ids = LARGE_JAPANESE_ARTISTS.map(a => a.id);

  console.log(`Fetching data for ${ids.length} artists...`);
  const spotifyData = await fetchBatch(ids, token);

  const enriched: EnrichedArtist[] = [];
  let updated = 0;
  let missing = 0;

  for (const base of LARGE_JAPANESE_ARTISTS) {
    const spotify = spotifyData.get(base.id);
    if (spotify) {
      enriched.push({
        name: spotify.name,
        id: spotify.id,
        popularity: spotify.popularity,
        followers: spotify.followers?.total ?? 0,
        genres: (spotify.genres ?? []).slice(0, 3),
        imageUrl: spotify.images?.[0]?.url ?? undefined,
        nameJa: (base as any).nameJa ?? undefined,
      });
      updated++;
    } else {
      // Keep original data if Spotify lookup fails
      enriched.push({
        name: base.name,
        id: base.id,
        popularity: base.popularity,
        followers: 0,
        genres: [],
        nameJa: (base as any).nameJa ?? undefined,
      });
      missing++;
      console.warn(`? Missing: ${base.name} (${base.id})`);
    }
  }

  // Write enriched data
  const outPath = path.join(__dirname, '..', 'lib', 'JapaneseArtists.ts');
  const content = `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(enriched, null, 2)} as const\n`;
  fs.writeFileSync(outPath, content);

  console.log(`\nDone: ${updated} enriched, ${missing} missing`);
  console.log(`Total: ${enriched.length} artists`);

  // Stats
  const withFollowers = enriched.filter(a => a.followers > 0).length;
  const withGenres = enriched.filter(a => a.genres.length > 0).length;
  const withImage = enriched.filter(a => a.imageUrl).length;
  const withNameJa = enriched.filter(a => a.nameJa).length;
  console.log(`  followers: ${withFollowers}/${enriched.length}`);
  console.log(`  genres: ${withGenres}/${enriched.length}`);
  console.log(`  imageUrl: ${withImage}/${enriched.length}`);
  console.log(`  nameJa: ${withNameJa}/${enriched.length}`);
}

main().catch(console.error);
