import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'

type Props = {
  score: string
  mode: string
  ogUrl: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const score = (query.score as string) || '0'
  const mode = (query.mode as string) || 'versus'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://soundiq.vercel.app')
  const v = (query.v as string) || '1'
  const ogUrl = `${baseUrl}/api/og?score=${score}&mode=${mode}&v=${v}`
  return { props: { score, mode, ogUrl } }
}

export default function SharePage({ score, mode, ogUrl }: Props) {
  const router = useRouter()
  const isTimeline = mode === 'timeline'
  const modeLabel = isTimeline ? 'TIMELINE' : 'VERSUS'

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <Head>
      <title>{`SOUND IQ ${modeLabel} - Score: ${score}/100`}</title>
      <meta name="description" content="Can you beat this score? Try SOUND IQ!" />
      <meta property="og:title" content={`SOUND IQ ${modeLabel} - Score: ${score}/100`} />
      <meta property="og:description" content="Can you beat this score? Try SOUND IQ!" />
      <meta property="og:image" content={ogUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`SOUND IQ ${modeLabel} - Score: ${score}/100`} />
      <meta name="twitter:image" content={ogUrl} />
    </Head>
  )
}
