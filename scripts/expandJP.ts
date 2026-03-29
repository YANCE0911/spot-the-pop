// scripts/expandJP.ts — Aggressively expand Japanese artist pool to 500+
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

const JP_GENRE_KEYWORDS = [
  'j-pop', 'j-rock', 'j-rap', 'j-r&b', 'j-dance', 'j-idol',
  'japanese', 'anime', 'kayokyoku', 'kayōkyoku', 'enka',
  'visual kei', 'shibuya-kei', 'city pop',
];

const JP_SEARCH_GENRES = [
  'j-pop', 'j-rock', 'j-rap', 'j-r&b', 'japanese indie',
  'anime', 'kayokyoku', 'enka', 'visual kei', 'j-dance',
  'j-idol', 'city pop', 'shibuya-kei', 'japanese math rock',
  'japanese singer-songwriter', 'japanese emo', 'japanese post-rock',
  'melodic hardcore', 'japanese jazz', 'japanese soul',
  'okinawan pop', 'japanese reggae', 'japanese ska',
  'vocaloid', 'japanese electropop', 'japanese shoegaze',
  'japanese noise rock', 'japanese hip hop',
];

// Manual additions that search misses
const MANUAL_ARTIST_NAMES = [
  'CHAI', 'tricot', 'toe', 'Suchmos', 'cero', 'LUCKY TAPES',
  'never young beach', 'THE ORAL CIGARETTES', 'Dragon Ash',
  'RIP SLYME', 'KREVA', 'KOHH', 'Awich', 'BAD HOP', 'ZORN',
  'RHYMESTER', 'ZEEBRA', 'KICK THE CAN CREW', 'Number Girl',
  '04 Limited Sazabys', 'ROTTENGRAFFTY', 'KEMURI', 'RIZE',
  'dustbox', 'locofrank', 'PETROLZ',
  // More missing artists
  'RADWIMPS', 'SiM', 'coldrain', 'Crossfaith', 'Crystal Lake',
  'SCANDAL', 'BAND-MAID', 'Wagakki Band', 'Ling tosite sigure',
  'MONO', 'Boris', 'envy', 'downy', 'LITE', 'mouse on the keys',
  'Midori', 'Kinoko Teikoku', 'Hitsujibungaku', 'Yogee New Waves',
  'SIRUP', 'Nulbarich', 'Tempalay', 'WONK', 'TENDRE',
  'D.A.N.', 'Luby Sparks', 'For Tracy Hyde', 'Homecomings',
  'Haru Nemuri', 'Rina Sawayama', 'Ichiko Aoba', 'Cornelius',
  'Pizzicato Five', 'Flipper\'s Guitar', 'Fishmans', 'OGRE YOU ASSHOLE',
  'andymori', 'GRAPEVINE', 'THE BACK HORN', 'ART-SCHOOL',
  'syrup16g', 'Straightener', 'HAWAIIAN6', 'Northern19',
  'Ryo Fukui', 'Hiromi', 'Soil&"PIMP"Sessions',
  'Gesu no Kiwami Otome', 'indigo la End', 'Kirinji',
  'Lamp', 'Mitsume', 'Wednesday Campanella', 'Daoko',
  'Reol', 'Ado', 'imase', 'Fujii Kaze', 'ano', 'yama',
  'Tani Yuuki', 'Omoinotake', 'BE:FIRST', 'INI', 'JO1',
  'NiziU', 'Da-iCE', 'SKY-HI', 'Novel Core', 'LEX',
  'ODD Foot Works', 'OMSB', 'PUNPEE', 'BIM', 'STUTS',
  'in the blue shirt', 'tofubeats', 'Yasutaka Nakata',
  'capsule', 'MONDO GROSSO', 'Nujabes', 'DJ Krush',
  'Mr.Children', 'ARASHI', 'GReeeeN', 'Eve', 'natori',
  'milet', 'CHANMINA', 'PornoGraffitti', 'Sukima Switch',
  'Shota Shimizu', 'HIRAIDAI', 'Superfly', 'BoA',
  'Tatsuya Kitani', 'DISH//', 'Lilas Ikuta',
];

const MIN_FOLLOWERS = 10_000; // lower threshold for manual adds

type ArtistData = {
  name: string;
  id: string;
  popularity: number;
  followers: number;
  genres: string[];
  imageUrl?: string;
  nameJa?: string;
};

function isJapaneseArtist(genres: string[]): boolean {
  return genres.some(g => JP_GENRE_KEYWORDS.some(k => g.includes(k)));
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const token = await getSpotifyToken();
  const existingMap = new Map<string, ArtistData>();
  for (const a of LARGE_JAPANESE_ARTISTS as unknown as ArtistData[]) {
    existingMap.set(a.id, a);
  }

  const newArtists = new Map<string, ArtistData>();

  // Phase 1: Search by JP genres
  console.log('Phase 1: JP genre search...');
  for (const genre of JP_SEARCH_GENRES) {
    for (const offset of [0, 50]) {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&limit=50&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.artists?.items ?? []) {
        if (existingMap.has(a.id) || newArtists.has(a.id)) continue;
        const followers = a.followers?.total ?? 0;
        if (followers < MIN_FOLLOWERS) continue;
        const genres = a.genres ?? [];
        if (!isJapaneseArtist(genres)) continue;
        newArtists.set(a.id, {
          name: a.name, id: a.id, popularity: a.popularity,
          followers, genres: genres.slice(0, 3),
          imageUrl: a.images?.[0]?.url,
        });
      }
    }
    await sleep(50);
  }
  console.log(`  ${newArtists.size} from genre search`);

  // Phase 2: Manual artist names
  console.log('Phase 2: Manual additions...');
  let manualAdded = 0;
  for (const name of MANUAL_ARTIST_NAMES) {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    // Find best match (exact or close name match)
    const items = data.artists?.items ?? [];
    const match = items.find((a: any) => a.name.toLowerCase() === name.toLowerCase())
      || items.find((a: any) => a.name.toLowerCase().includes(name.toLowerCase()))
      || null;
    if (match && !existingMap.has(match.id) && !newArtists.has(match.id)) {
      const followers = match.followers?.total ?? 0;
      if (followers >= MIN_FOLLOWERS) {
        newArtists.set(match.id, {
          name: match.name, id: match.id, popularity: match.popularity,
          followers, genres: (match.genres ?? []).slice(0, 3),
          imageUrl: match.images?.[0]?.url,
        });
        manualAdded++;
      }
    }
    await sleep(30);
  }
  console.log(`  ${manualAdded} from manual list`);

  // Phase 3: Related artists from JP seeds
  console.log('Phase 3: Related artists...');
  const jpExisting = [...existingMap.values()].filter(a =>
    (a as any).nameJa || isJapaneseArtist(a.genres ?? [])
  );
  const seeds = [...jpExisting].sort(() => 0.5 - Math.random()).slice(0, 50);
  let relatedAdded = 0;
  for (const seed of seeds) {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${seed.id}/related-artists`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const a of data.artists ?? []) {
      if (existingMap.has(a.id) || newArtists.has(a.id)) continue;
      const followers = a.followers?.total ?? 0;
      if (followers < MIN_FOLLOWERS) continue;
      const genres = a.genres ?? [];
      if (!isJapaneseArtist(genres)) continue;
      newArtists.set(a.id, {
        name: a.name, id: a.id, popularity: a.popularity,
        followers, genres: genres.slice(0, 3),
        imageUrl: a.images?.[0]?.url,
      });
      relatedAdded++;
    }
    await sleep(50);
  }
  console.log(`  ${relatedAdded} from related artists`);

  // Merge
  const allNew = [...newArtists.values()].sort((a, b) => b.followers - a.followers);
  console.log(`\nNew JP artists found: ${allNew.length}`);

  const existing = (LARGE_JAPANESE_ARTISTS as unknown as ArtistData[]).map(a => ({ ...a }));
  const merged = [...existing, ...allNew];

  const outPath = path.join(__dirname, '..', 'lib', 'JapaneseArtists.ts');
  fs.writeFileSync(outPath,
    `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(merged, null, 2)} as const\n`
  );

  // Count JP pool
  const jpPool = merged.filter(a =>
    (a as any).nameJa || isJapaneseArtist(a.genres ?? [])
  ).filter(a => a.followers >= 50000);
  console.log(`\nTotal list: ${merged.length}`);
  console.log(`JP出題プール (followers>=50K): ${jpPool.length}`);
}

main().catch(console.error);
