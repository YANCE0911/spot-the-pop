import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'

const GA_ID = 'G-DMXN1N0ZYJ'
const ADSENSE_ID = 'ca-pub-8025714043604505'

export const metadata: Metadata = {
  title: 'SOUND IQ - Music Quiz Game',
  description: 'Music quiz games for music lovers. Match artists by popularity or guess the release year!',
  openGraph: {
    title: 'SOUND IQ',
    description: 'How deep is your music knowledge?',
    siteName: 'SOUND IQ',
    type: 'website',
    images: ['https://soundiq.vercel.app/api/og?score=0&mode=versus'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SOUND IQ',
    description: 'How deep is your music knowledge?',
    images: ['https://soundiq.vercel.app/api/og?score=0&mode=versus'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased font-display">
        {children}
        <footer className="text-center text-zinc-700 text-xs py-4 px-4">
          Powered by Spotify API — Not affiliated with Spotify
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
