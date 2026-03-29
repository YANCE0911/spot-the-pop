import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

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

export default async function SharePage() {
  redirect('/')
}
