/**
 * Fetch popular global artists from Spotify and save as a static pool.
 * Expanded version: genre search + decade queries + playlist crawl + related artists
 * Run: npx ts-node scripts/fetchGlobalArtists.ts
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
dotenv.config()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.SPOTIPY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.SPOTIPY_CLIENT_SECRET

async function getToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

type ArtistData = {
  name: string
  id: string
  popularity: number
  followers: number
  genres: string[]
  imageUrl: string | null
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// --- Search helpers ---

async function searchArtists(token: string, query: string, offset = 0): Promise<ArtistData[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=50&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.artists?.items ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres?.slice(0, 5) ?? [],
    imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
  }))
}

async function fetchRelatedArtists(token: string, artistId: string): Promise<ArtistData[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.artists ?? []).map((a: any) => ({
    name: a.name,
    id: a.id,
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
    genres: a.genres?.slice(0, 5) ?? [],
    imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
  }))
}

async function getPlaylistArtistIds(token: string, playlistId: string): Promise<string[]> {
  const ids = new Set<string>()
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(artists(id))),next&limit=100`
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) break
    const data: any = await res.json()
    for (const item of data.items ?? []) {
      for (const artist of item.track?.artists ?? []) {
        if (artist.id) ids.add(artist.id)
      }
    }
    url = data.next
    if (url) await sleep(50)
  }
  return [...ids]
}

async function searchPlaylists(token: string, query: string): Promise<string[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.playlists?.items ?? []).filter((p: any) => p?.id).map((p: any) => p.id)
}

async function fetchArtistsBatch(token: string, ids: string[]): Promise<ArtistData[]> {
  const results: ArtistData[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) { await sleep(200); continue }
    const data = await res.json()
    for (const a of data.artists ?? []) {
      if (!a) continue
      results.push({
        name: a.name,
        id: a.id,
        popularity: a.popularity,
        followers: a.followers?.total ?? 0,
        genres: (a.genres ?? []).slice(0, 5),
        imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
      })
    }
    await sleep(100)
  }
  return results
}

// --- Discovery sources ---

// Broad genre list covering global music
const GENRES = [
  // Western mainstream
  'pop', 'rock', 'hip hop', 'r&b', 'electronic', 'indie', 'alternative',
  'country', 'metal', 'punk', 'jazz', 'blues', 'soul', 'funk', 'reggae',
  'classical', 'folk', 'singer-songwriter', 'dance', 'house', 'techno',
  'drum and bass', 'dubstep', 'trap', 'emo', 'grunge', 'new wave',
  'post-punk', 'shoegaze', 'dream pop', 'psychedelic rock', 'prog rock',
  'hard rock', 'soft rock', 'art rock', 'garage rock', 'brit pop',
  'disco', 'gospel', 'neo soul', 'contemporary r&b',
  // Regional
  'k-pop', 'afrobeats', 'latin', 'reggaeton', 'latin pop', 'latin rock',
  'bossa nova', 'samba', 'mpb', 'french pop', 'german pop', 'italian pop',
  'mandopop', 'cantopop', 'turkish pop', 'arabic pop', 'indian pop',
  'punjabi', 'bollywood', 'swedish pop', 'australian rock',
  'afropop', 'highlife', 'dancehall', 'soca',
]

// Decade + region specific queries for better year coverage
const DECADE_QUERIES = [
  // 60s-70s legends
  'The Beatles', 'The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'David Bowie',
  'Bob Dylan', 'Jimi Hendrix', 'The Who', 'The Doors', 'Stevie Wonder',
  'Aretha Franklin', 'Marvin Gaye', 'James Brown', 'Bob Marley', 'ABBA',
  'Elton John', 'Fleetwood Mac', 'Eagles', 'Bee Gees', 'The Beach Boys',
  'Simon & Garfunkel', 'Joni Mitchell', 'The Clash', 'Ramones', 'Black Sabbath',
  // 80s
  'Michael Jackson', 'Madonna', 'Prince', 'U2', 'Depeche Mode',
  'The Cure', 'Duran Duran', 'The Smiths', 'Guns N Roses', 'Bon Jovi',
  'Whitney Houston', 'Bruce Springsteen', 'Tina Turner', 'George Michael', 'Pet Shop Boys',
  'New Order', 'Tears for Fears', 'A-ha', 'Phil Collins', 'Van Halen',
  'Metallica', 'Iron Maiden', 'Def Leppard', 'AC/DC', 'Talking Heads',
  // 90s
  'Nirvana', 'Oasis', 'Radiohead', 'Red Hot Chili Peppers', 'Green Day',
  'Foo Fighters', 'Pearl Jam', 'Weezer', 'Blur', 'The Cranberries',
  'No Doubt', 'Alanis Morissette', 'TLC', 'Backstreet Boys', 'NSYNC',
  'Spice Girls', 'Lauryn Hill', 'Notorious BIG', '2Pac', 'Wu-Tang Clan',
  'Beastie Boys', 'A Tribe Called Quest', 'OutKast', 'Daft Punk', 'Massive Attack',
  'Portishead', 'Bjork', 'PJ Harvey', 'Jeff Buckley', 'Elliott Smith',
  // 2000s
  'Eminem', 'Kanye West', 'Jay-Z', 'Beyonce', 'Rihanna',
  'Coldplay', 'Muse', 'Arctic Monkeys', 'The Strokes', 'The White Stripes',
  'Linkin Park', 'System of a Down', 'My Chemical Romance', 'Fall Out Boy', 'Paramore',
  'Amy Winehouse', 'Gorillaz', 'The Killers', 'Franz Ferdinand', 'Arcade Fire',
  'Nelly Furtado', 'Alicia Keys', 'John Legend', 'Usher', 'Pharrell',
  'Timbaland', 'Missy Elliott', 'Lil Wayne', '50 Cent', 'T.I.',
  // 2010s
  'Adele', 'Ed Sheeran', 'Taylor Swift', 'Bruno Mars', 'Lady Gaga',
  'Drake', 'Kendrick Lamar', 'The Weeknd', 'Frank Ocean', 'Tyler the Creator',
  'Billie Eilish', 'Lana Del Rey', 'Tame Impala', 'Mac DeMarco', 'Vampire Weekend',
  'Lorde', 'Sam Smith', 'Sia', 'Hozier', 'Imagine Dragons',
  'Twenty One Pilots', 'Childish Gambino', 'Chance the Rapper', 'J. Cole', 'Travis Scott',
  'Post Malone', 'Cardi B', 'Megan Thee Stallion', 'Lizzo', 'Khalid',
  // 2020s
  'Dua Lipa', 'Olivia Rodrigo', 'Sabrina Carpenter', 'Doja Cat', 'SZA',
  'Bad Bunny', 'BTS', 'BLACKPINK', 'Stray Kids', 'NewJeans', 'aespa',
  'Peso Pluma', 'Feid', 'Karol G', 'Rosalia', 'Anitta',
  'Steve Lacy', 'Daniel Caesar', 'Omar Apollo', 'Dominic Fike', 'Beabadoobee',
  'Phoebe Bridgers', 'Boygenius', 'Wet Leg', 'Fontaines D.C.', 'Turnstile',
  'Ice Spice', 'Central Cee', 'Dave', '21 Savage', 'Metro Boomin',
  'Burna Boy', 'Wizkid', 'Tems', 'Rema', 'Ayra Starr',
  // Classic rock / classic pop deep cuts
  'Dire Straits', 'Electric Light Orchestra', 'Supertramp', 'Toto', 'Steely Dan',
  'Yes', 'Genesis', 'King Crimson', 'Rush', 'Deep Purple',
  'Lynyrd Skynyrd', 'Creedence Clearwater Revival', 'The Allman Brothers Band',
  'The Kinks', 'The Velvet Underground', 'Cream', 'Traffic', 'Free',
  'Chicago', 'Earth Wind & Fire', 'Kool & The Gang', 'The Temptations', 'The Four Tops',
]

// Playlist search queries for discovery
const PLAYLIST_QUERIES = [
  'Top Hits 2025', 'Today\'s Top Hits', 'Global Top 50',
  'All Out 60s', 'All Out 70s', 'All Out 80s', 'All Out 90s', 'All Out 2000s', 'All Out 2010s',
  'Rock Classics', 'Hip Hop Classics', 'R&B Classics',
  'Indie Rock Essential', 'Alternative 90s',
  'K-Pop Rising', 'K-Pop Hits', 'Latin Pop Rising',
  'African Heat', 'Afrobeats Hits', 'Baila Reggaeton',
  'Classic Rock', 'Soft Rock', 'Hard Rock', 'Metal Essentials',
  'Jazz Classics', 'Blues Classics', 'Soul Classics', 'Funk Classics',
  'Electronic Rising', 'Chillwave', 'Synthwave',
  'French Pop', 'German Pop', 'Italian Pop',
  'Best of British', 'Australian Made', 'Nordic Rising',
  'Bollywood Hits', 'Arab Pop', 'Turkish Hits',
  'Pop Rising', 'Rap Caviar', 'Most Necessary',
]

async function main() {
  let token = await getToken()
  const allArtists = new Map<string, ArtistData>()

  // --- Phase 1: Genre search (with offsets 0, 50, 100 for more depth) ---
  console.log('Phase 1: Genre search...')
  for (const genre of GENRES) {
    for (const offset of [0, 50, 100]) {
      const artists = await searchArtists(token, `genre:${genre}`, offset)
      for (const a of artists) allArtists.set(a.id, a)
      await sleep(80)
    }
    if (allArtists.size % 500 < 10) {
      console.log(`  ${genre}: total so far ${allArtists.size}`)
    }
  }
  console.log(`  Genre search complete: ${allArtists.size} artists`)

  // Refresh token
  token = await getToken()

  // --- Phase 2: Named artist queries ---
  console.log('Phase 2: Named artist queries...')
  const beforeNamed = allArtists.size
  for (const q of DECADE_QUERIES) {
    const artists = await searchArtists(token, q)
    for (const a of artists) allArtists.set(a.id, a)
    await sleep(50)
  }
  console.log(`  Named queries: +${allArtists.size - beforeNamed} (total: ${allArtists.size})`)

  // Refresh token
  token = await getToken()

  // --- Phase 3: Playlist crawl ---
  console.log('Phase 3: Playlist crawl...')
  const beforePlaylist = allArtists.size
  const crawledArtistIds = new Set<string>()
  for (const q of PLAYLIST_QUERIES) {
    const playlistIds = await searchPlaylists(token, q)
    for (const pid of playlistIds.slice(0, 3)) {
      const artistIds = await getPlaylistArtistIds(token, pid)
      for (const id of artistIds) crawledArtistIds.add(id)
      await sleep(50)
    }
    await sleep(80)
  }
  // Fetch details for new IDs
  const newIdsFromPlaylists = [...crawledArtistIds].filter(id => !allArtists.has(id))
  console.log(`  Found ${newIdsFromPlaylists.length} new artist IDs from playlists, fetching details...`)

  token = await getToken()
  const playlistArtists = await fetchArtistsBatch(token, newIdsFromPlaylists)
  for (const a of playlistArtists) allArtists.set(a.id, a)
  console.log(`  Playlist crawl: +${allArtists.size - beforePlaylist} (total: ${allArtists.size})`)

  // --- Phase 4: Related Artists from top seeds ---
  console.log('Phase 4: Related Artists...')
  token = await getToken()
  const beforeRelated = allArtists.size
  // Pick top-popularity artists as seeds
  const seeds = [...allArtists.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 100)
  for (const seed of seeds) {
    const related = await fetchRelatedArtists(token, seed.id)
    for (const a of related) {
      if (!allArtists.has(a.id)) allArtists.set(a.id, a)
    }
    await sleep(80)
  }
  console.log(`  Related artists: +${allArtists.size - beforeRelated} (total: ${allArtists.size})`)

  // --- Filter ---
  // Load Japanese artist IDs to exclude (they're in the JP bank)
  const jaArtistsRaw = fs.readFileSync('lib/JapaneseArtists.ts', 'utf-8')
  const jaIds = new Set<string>()
  for (const m of jaArtistsRaw.matchAll(/"id":\s*"([^"]+)"/g)) {
    jaIds.add(m[1])
  }

  const filtered = [...allArtists.values()]
    .filter(a => !jaIds.has(a.id) && a.popularity >= 30 && a.followers >= 10000)
    .sort((a, b) => b.popularity - a.popularity)

  console.log(`\nTotal unique: ${allArtists.size}`)
  console.log(`Excluded JP: ${jaIds.size}`)
  console.log(`After filter (pop>=30, followers>=10K, non-JP): ${filtered.length}`)

  // Stats
  const popBuckets: Record<string, number> = {}
  for (const a of filtered) {
    const bucket = `${Math.floor(a.popularity / 10) * 10}-${Math.floor(a.popularity / 10) * 10 + 9}`
    popBuckets[bucket] = (popBuckets[bucket] || 0) + 1
  }
  console.log('Popularity distribution:', popBuckets)

  const output = `// Auto-generated global artist pool
// Generated: ${new Date().toISOString()}
// Count: ${filtered.length}

export const GLOBAL_ARTISTS = ${JSON.stringify(filtered, null, 2)} as const
`

  fs.writeFileSync('lib/GlobalArtists.ts', output)
  console.log(`Saved ${filtered.length} artists to lib/GlobalArtists.ts`)
}

main().catch(console.error)
