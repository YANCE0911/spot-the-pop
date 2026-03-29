import type { Metadata } from 'next'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ score?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const score = params.score ?? '0'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spot-the-pop.vercel.app'
  const ogUrl = `${baseUrl}/api/og?score=${score}`

  return {
    title: `SPOT THE POP - Score: ${score}/100`,
    description: 'Can you beat this score? Try SPOT THE POP!',
    openGraph: {
      title: `SPOT THE POP - Score: ${score}/100`,
      description: 'Can you beat this score? Try SPOT THE POP!',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `SPOT THE POP - Score: ${score}/100`,
      images: [ogUrl],
    },
  }
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams
  const score = params.score ?? '0'

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-4">
      <p className="text-brand font-bold text-sm tracking-widest uppercase">SPOT THE POP</p>
      <p className="text-5xl font-black">{score}<span className="text-zinc-500 text-lg ml-2">/100</span></p>
      <Link
        href="/"
        className="bg-brand text-black py-3 px-8 rounded-xl font-bold hover:bg-brand-light transition-all"
      >
        Play Now
      </Link>
    </main>
  )
}
