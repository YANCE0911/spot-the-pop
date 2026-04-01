import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'

type Props = {
  score: string
  mode: string
  ogUrl: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const score = (query.score as string) || '0'
  const mode = (query.mode as string) || 'versus'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://soundiq.vercel.app')
  const ogUrl = `${baseUrl}/api/og?score=${score}&mode=${mode}`
  return { props: { score, mode, ogUrl } }
}

export default function SharePage({ score, mode, ogUrl }: Props) {
  const isTimeline = mode === 'timeline'
  const modeLabel = isTimeline ? 'TIMELINE' : 'VERSUS'
  const accentClass = isTimeline ? 'text-accent' : 'text-brand'
  const btnClass = isTimeline ? 'bg-accent text-white' : 'bg-brand text-black'

  return (
    <>
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
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-4">
        <p className={`${accentClass} font-bold text-sm tracking-widest uppercase`}>SOUND IQ - {modeLabel}</p>
        <p className="text-5xl font-black">{score}<span className="text-zinc-500 text-lg ml-2">/100</span></p>
        <Link
          href="/"
          className={`${btnClass} py-3 px-8 rounded-xl font-bold hover:brightness-110 transition-all`}
        >
          Play Now
        </Link>
      </main>
    </>
  )
}
