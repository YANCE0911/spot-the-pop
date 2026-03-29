import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SPOT THE POP - Music Popularity Guessing Game',
  description: 'Guess the artist with the closest Spotify score. Challenge your music knowledge!',
  openGraph: {
    title: 'SPOT THE POP',
    description: 'Can you guess the artist with the closest Spotify score?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPOT THE POP',
    description: 'Can you guess the artist with the closest Spotify score?',
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
