import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'

type Props = {
  score: string
  ogUrl: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const score = (query.score as string) || '0'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spot-the-pop.vercel.app'
  const ogUrl = `${baseUrl}/api/og?score=${score}`
  return { props: { score, ogUrl } }
}

export default function SharePage({ score, ogUrl }: Props) {
  return (
    <>
      <Head>
        <title>{`SPOT THE POP - Score: ${score}/100`}</title>
        <meta name="description" content="Can you beat this score? Try SPOT THE POP!" />
        <meta property="og:title" content={`SPOT THE POP - Score: ${score}/100`} />
        <meta property="og:description" content="Can you beat this score? Try SPOT THE POP!" />
        <meta property="og:image" content={ogUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`SPOT THE POP - Score: ${score}/100`} />
        <meta name="twitter:image" content={ogUrl} />
      </Head>
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
    </>
  )
}
