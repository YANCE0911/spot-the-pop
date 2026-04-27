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
    images: ['https://soundiq.app/og-brand.png?v=7'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SOUND IQ',
    description: 'How deep is your music knowledge?',
    images: ['https://soundiq.app/og-brand.png?v=7'],
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
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var OLD_HOST = 'soundiq.vercel.app';
            var NEW_HOST = 'soundiq.app';
            var KEYS = ['soundiq_player_id', 'soundiq_name', 'soundiq_last_mode', 'soundiq_last_difficulty', 'soundiq_timeline_difficulty', 'soundiq_versus_difficulty', 'soundiq_visited', 'soundiq_lang'];
            if (location.hostname === OLD_HOST || location.hostname === 'spot-the-pop.vercel.app') {
              var data = {};
              for (var i = 0; i < KEYS.length; i++) {
                var v = localStorage.getItem(KEYS[i]);
                if (v) data[KEYS[i]] = v;
              }
              var qs = Object.keys(data).length > 0 ? '?migrate=' + encodeURIComponent(JSON.stringify(data)) : '';
              location.replace('https://' + NEW_HOST + location.pathname + qs);
              return;
            }
            if (location.hostname === NEW_HOST) {
              var params = new URLSearchParams(location.search);
              var raw = params.get('migrate');
              if (raw) {
                try {
                  var d = JSON.parse(raw);
                  for (var k in d) {
                    localStorage.setItem(k, d[k]);
                  }
                } catch(e) {}
                params.delete('migrate');
                var clean = params.toString();
                history.replaceState(null, '', location.pathname + (clean ? '?' + clean : ''));
              }
            }
          })();
        `}} />
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
        <footer className="text-center text-zinc-600 text-xs py-2 px-4 space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1DB954]"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            <span>Powered by Spotify API · Not affiliated with Spotify</span>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
