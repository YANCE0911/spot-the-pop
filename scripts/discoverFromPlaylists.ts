// scripts/discoverFromPlaylists.ts — Discover JP artists from Spotify playlists + Japanese name detection
// Usage: npx ts-node scripts/discoverFromPlaylists.ts [--dry-run]
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

// --- Config ---

const JP_GENRE_KEYWORDS = [
  'j-pop', 'j-rock', 'j-rap', 'j-r&b', 'j-dance', 'j-idol',
  'japanese', 'anime', 'kayokyoku', 'kayōkyoku', 'enka',
  'visual kei', 'shibuya-kei', 'city pop',
];

// Search queries to discover JP playlists dynamically
const PLAYLIST_SEARCH_QUERIES = [
  'J-POP ヒット', 'J-POP 2025', 'J-POP 2026',
  'J-ROCK 邦ロック', '邦楽 人気', '邦楽 ヒット',
  '日本語ラップ', 'Japanese Hip Hop',
  'アニソン 人気', 'anime songs',
  '令和 ヒット曲', '平成 名曲', '昭和 歌謡',
  'Japanese indie', 'city pop', 'ボカロ 人気',
  'J-R&B', 'Japanese R&B',
  'visual kei', 'Japanese rock',
  'Tokyo Super Hits', 'Hot Hits Japan',
  'Gacha Pop', 'J-Pop Rising',
];

const MIN_FOLLOWERS = 10_000; // Low threshold for discovery; game-side filtering handles the rest

type ArtistData = {
  name: string;
  id: string;
  popularity: number;
  followers: number;
  genres: string[];
  imageUrl?: string;
  nameJa?: string;
};

// --- Japanese detection ---

const JP_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

function hasJapaneseChars(s: string): boolean {
  return JP_CHAR_REGEX.test(s);
}

function isJapaneseArtist(genres: string[], name?: string): boolean {
  if (genres.some(g => JP_GENRE_KEYWORDS.some(k => g.includes(k)))) return true;
  if (name && hasJapaneseChars(name)) return true;
  return false;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// --- API helpers ---

async function getPlaylistArtistIds(playlistId: string, token: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(artists(id))),next&limit=100`;

  while (url) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) break;
    const data: any = await res.json();
    for (const item of data.items ?? []) {
      for (const artist of item.track?.artists ?? []) {
        if (artist.id) ids.add(artist.id);
      }
    }
    url = data.next;
    if (url) await sleep(50);
  }
  return ids;
}

async function searchPlaylists(query: string, token: string): Promise<string[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5&market=JP`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.playlists?.items ?? []).filter((p: any) => p && p.id).map((p: any) => p.id);
}

async function fetchArtistsBatch(ids: string[], token: string): Promise<ArtistData[]> {
  const results: ArtistData[] = [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50));
  }
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) { await sleep(100); continue; }
    const data = await res.json();
    for (const a of data.artists ?? []) {
      if (!a) continue;
      results.push({
        name: a.name,
        id: a.id,
        popularity: a.popularity,
        followers: a.followers?.total ?? 0,
        genres: (a.genres ?? []).slice(0, 3),
        imageUrl: a.images?.[0]?.url,
      });
    }
    await sleep(50);
  }
  return results;
}

// --- Main ---

async function main() {
  const token = await getSpotifyToken();
  const existingIds = new Set<string>(LARGE_JAPANESE_ARTISTS.map(a => a.id));
  const candidateIds = new Set<string>();

  // Phase 1: Discover playlists via search
  console.log('Phase 1: Searching for JP playlists...');
  const playlistIds = new Set<string>();
  for (const q of PLAYLIST_SEARCH_QUERIES) {
    const pids = await searchPlaylists(q, token);
    for (const pid of pids) playlistIds.add(pid);
    await sleep(100);
  }
  console.log(`  Found ${playlistIds.size} unique playlists`);

  // Phase 2: Crawl playlists for artist IDs
  console.log('Phase 2: Crawling playlists for artists...');
  let crawled = 0;
  for (const pid of playlistIds) {
    const ids = await getPlaylistArtistIds(pid, token);
    for (const id of ids) {
      if (!existingIds.has(id)) candidateIds.add(id);
    }
    crawled++;
    if (crawled % 20 === 0) console.log(`  ${crawled}/${playlistIds.size} playlists, ${candidateIds.size} new IDs`);
    await sleep(100);
  }
  console.log(`  ${candidateIds.size} unique new artist IDs from ${playlistIds.size} playlists`);

  // Phase 3: Fetch artist details and filter JP
  console.log('Phase 3: Fetching artist details...');
  const allCandidateIds = [...candidateIds];
  const artists = await fetchArtistsBatch(allCandidateIds, token);

  const jpArtists = artists.filter(a => {
    if (a.followers < MIN_FOLLOWERS) return false;
    return isJapaneseArtist(a.genres, a.name);
  });

  // Add nameJa for artists with Japanese characters in their name
  for (const a of jpArtists) {
    if (hasJapaneseChars(a.name)) {
      a.nameJa = a.name;
    }
  }

  const sorted = jpArtists.sort((a, b) => b.followers - a.followers);

  console.log(`\nTotal candidates fetched: ${artists.length}`);
  console.log(`JP artists (followers >= ${MIN_FOLLOWERS.toLocaleString()}): ${sorted.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] New JP artists found:');
    for (const a of sorted.slice(0, 50)) {
      console.log(`  ${a.name.padEnd(30)} ${String(a.followers.toLocaleString()).padStart(12)}  ${a.genres.join(', ')}`);
    }
    if (sorted.length > 50) console.log(`  ... and ${sorted.length - 50} more`);
    return;
  }

  // Merge with existing
  const existing = (LARGE_JAPANESE_ARTISTS as unknown as ArtistData[]).map(a => ({ ...a }));
  const merged = [...existing, ...sorted];

  const outPath = path.join(__dirname, '..', 'lib', 'JapaneseArtists.ts');
  fs.writeFileSync(outPath,
    `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(merged, null, 2)} as const\n`
  );

  console.log(`\nWritten: ${existing.length} existing + ${sorted.length} new = ${merged.length} total`);

  // Stats
  const jp100k = merged.filter(a =>
    (a.followers ?? 0) >= 100_000 &&
    (a.nameJa || isJapaneseArtist(a.genres ?? [], a.name))
  );
  console.log(`JP出題プール (followers >= 100K): ${jp100k.length}`);
}

main().catch(console.error);
