/**
 * Archive current TOP 10 rankings as a named season.
 * Usage: npx tsx scripts/archiveSeason.ts "Season 1"
 */
import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit, setDoc, doc, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  const seasonName = process.argv[2] || 'Season 1'
  console.log(`Archiving current TOP 10 as "${seasonName}"...`)

  const q = query(collection(db, 'ranking'), orderBy('score'), limit(10))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    console.log('No rankings found.')
    process.exit(0)
  }

  const rankings = snapshot.docs.map((d, i) => ({
    rank: i + 1,
    name: d.data().name,
    score: d.data().score,
    mode: d.data().mode ?? 'classic',
    metric: d.data().metric ?? 'popularity',
  }))

  console.log('Rankings to archive:')
  rankings.forEach(r => console.log(`  #${r.rank} ${r.name}: ${r.score}`))

  const seasonId = seasonName.toLowerCase().replace(/\s+/g, '-')
  await setDoc(doc(db, 'season_archives', seasonId), {
    name: seasonName,
    rankings,
    archivedAt: Timestamp.now(),
  })

  console.log(`\nArchived to season_archives/${seasonId}`)
}

main().catch(console.error)
