// scripts/expandPool.ts — Discover new artists via Related Artists + genre search
// Usage: npx ts-node scripts/expandPool.ts [--dry-run]
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

const DRY_RUN = process.argv.includes('--dry-run');

// Filter config
const MIN_FOLLOWERS = 10_000;
const MIN_POPULARITY = 20;
const MAX_POPULARITY = 85;
const LEGEND_FOLLOWERS = 5_000_000; // legends bypass popularity filter

// Genre search seeds for diversity
const GENRE_SEEDS = [
  // International
  'k-pop', 'indie rock', 'latin pop', 'hip hop', 'r&b',
  'electronic', 'jazz', 'classical', 'reggaeton', 'country',
  'afrobeats', 'french pop', 'german pop', 'mandopop', 'turkish pop',
  // Japanese (critical for JP pool)
  'j-pop', 'j-rock', 'j-rap', 'j-r&b', 'japanese indie',
  'anime', 'kayokyoku', 'enka', 'visual kei', 'j-dance',
  'j-idol', 'city pop', 'shibuya-kei', 'japanese math rock',
  'japanese singer-songwriter', 'japanese emo',
];

type RawArtist = {
  name: string;
  id: string;
  popularity: number;
  followers: number;
  genres: string[];
  imageUrl?: string;
};

async function fetchRelatedArtists(artistId: string, token: string): Promise<RawArtist[]> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.artists ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: (a.genres ?? []).slice(0, 3),
    imageUrl: a.images?.[0]?.url,
  }));
}

async function searchByGenre(genre: string, token: string, limit = 50): Promise<RawArtist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.artists?.items ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: (a.genres ?? []).slice(0, 3),
    imageUrl: a.images?.[0]?.url,
  }));
}

function passesFilter(a: RawArtist): boolean {
  if (a.followers < MIN_FOLLOWERS) return false;
  // Legends bypass popularity filter
  if (a.followers >= LEGEND_FOLLOWERS) return true;
  if (a.popularity < MIN_POPULARITY || a.popularity > MAX_POPULARITY) return false;
  return true;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const token = await getSpotifyToken();
  const existingIds = new Set<string>(LARGE_JAPANESE_ARTISTS.map(a => a.id));
  const candidates = new Map<string, RawArtist>();

  // Phase 1: Related Artists from random seed artists
  console.log('Phase 1: Related Artists...');
  const shuffled = [...LARGE_JAPANESE_ARTISTS].sort(() => 0.5 - Math.random());
  const seeds = shuffled.slice(0, 30); // Sample 30 seeds

  for (const seed of seeds) {
    const related = await fetchRelatedArtists(seed.id, token);
    for (const a of related) {
      if (!existingIds.has(a.id) && !candidates.has(a.id) && passesFilter(a)) {
        candidates.set(a.id, a);
      }
    }
    await sleep(100); // Rate limit courtesy
  }
  console.log(`  Found ${candidates.size} candidates from related artists`);

  // Phase 2: Genre search for diversity
  console.log('Phase 2: Genre search...');
  const beforeGenre = candidates.size;
  for (const genre of GENRE_SEEDS) {
    const results = await searchByGenre(genre, token);
    for (const a of results) {
      if (!existingIds.has(a.id) && !candidates.has(a.id) && passesFilter(a)) {
        candidates.set(a.id, a);
      }
    }
    await sleep(100);
  }
  console.log(`  Found ${candidates.size - beforeGenre} additional from genre search`);

  // Sort by followers descending (prioritize well-known artists)
  const newArtists = [...candidates.values()]
    .sort((a, b) => b.followers - a.followers);

  console.log(`\nTotal new candidates: ${newArtists.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Top 20 candidates:');
    for (const a of newArtists.slice(0, 20)) {
      console.log(`  ${a.name} | followers: ${a.followers.toLocaleString()} | pop: ${a.popularity} | genres: ${a.genres.join(', ')}`);
    }
    return;
  }

  // Merge with existing
  const existing = LARGE_JAPANESE_ARTISTS.map(a => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: (a as any).followers ?? 0,
    genres: (a as any).genres ? [...(a as any).genres] : [],
    imageUrl: (a as any).imageUrl,
    nameJa: (a as any).nameJa,
  }));

  const merged = [...existing, ...newArtists];

  const outPath = path.join(__dirname, '..', 'lib', 'JapaneseArtists.ts');
  const content = `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(merged, null, 2)} as const\n`;
  fs.writeFileSync(outPath, content);

  console.log(`\nWritten: ${existing.length} existing + ${newArtists.length} new = ${merged.length} total`);

  // Genre distribution
  const genreCounts = new Map<string, number>();
  for (const a of merged) {
    for (const g of a.genres ?? []) {
      genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
    }
  }
  console.log('\nTop genres:');
  [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([g, c]) => console.log(`  ${g}: ${c}`));
}

main().catch(console.error);
