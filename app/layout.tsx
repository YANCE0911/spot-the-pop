import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOUND IQ - Music Quiz Game',
  description: 'Music quiz games for music lovers. Match artists by popularity or guess the release year!',
  openGraph: {
    title: 'SOUND IQ',
    description: 'How deep is your music knowledge?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SOUND IQ',
    description: 'How deep is your music knowledge?',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased font-display">
        {children}
        <footer className="text-center text-zinc-700 text-xs py-4 px-4">
          Powered by Spotify API — Not affiliated with Spotify
        </footer>
      </body>
    </html>
  )
}
