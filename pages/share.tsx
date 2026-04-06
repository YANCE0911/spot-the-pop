import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'

type Props = {
  score: string
  mode: string
  artist: string
  ogUrl: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const score = (query.score as string) || '0'
  const mode = (query.mode as string) || 'versus'
  const artist = (query.artist as string) || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://soundiq.app')
  const ogParams = new URLSearchParams({ score, mode })
  if (artist) ogParams.set('artist', artist)
  const ogUrl = `${baseUrl}/api/og?${ogParams.toString()}`
  return { props: { score, mode, artist, ogUrl } }
}

export default function SharePage({ score, mode, artist, ogUrl }: Props) {
  const router = useRouter()
  const isTimeline = mode === 'timeline'
  const modeLabel = artist ? `TIMELINE - ${artist}` : isTimeline ? 'TIMELINE' : 'VERSUS'
  const title = artist
    ? `SOUND IQ - ${artist} ${score}点`
    : `SOUND IQ ${modeLabel} - Score: ${score}/100`

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content="あなたの音楽IQは？ SOUND IQに挑戦しよう！" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content="あなたの音楽IQは？ SOUND IQに挑戦しよう！" />
      <meta property="og:image" content={ogUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:image" content={ogUrl} />
    </Head>
  )
}
