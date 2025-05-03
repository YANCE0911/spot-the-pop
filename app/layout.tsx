import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SPOT THE POP',
  description: 'Spotifyアーティストの人気度を当てるゲーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}