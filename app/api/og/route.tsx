import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function loadFonts() {
  const [montserrat, notoSansJp] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-Y3tcoqK5.ttf').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFLgk75s.ttf').then(r => r.arrayBuffer()),
  ])
  return { montserrat, notoSansJp }
}

function getGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'S', color: '#facc15' }
  if (score >= 80) return { label: 'A', color: '#4ade80' }
  if (score >= 70) return { label: 'B', color: '#60a5fa' }
  if (score >= 60) return { label: 'C', color: '#d4d4d8' }
  if (score >= 50) return { label: 'D', color: '#fb923c' }
  return { label: 'E', color: '#f87171' }
}

export async function GET(req: NextRequest) {
  const { montserrat, notoSansJp } = await loadFonts()
  const fonts = [
    { name: 'Montserrat', data: montserrat, weight: 900 as const, style: 'normal' as const },
    { name: 'NotoSansJP', data: notoSansJp, weight: 900 as const, style: 'normal' as const },
  ]

  const { searchParams } = req.nextUrl
  const brand = searchParams.get('brand')
  const mode = searchParams.get('mode') ?? 'versus'
  const isTimeline = mode === 'timeline'
  const accentColor = isTimeline ? '#a855f7' : '#1DB954'
  const modeLabel = isTimeline ? 'WHEN?' : 'WHO?'

  // Brand mode: static image without scores
  if (brand === '1') {
    // note header ratio: 1280x670
    const isNoteHeader = searchParams.get('note') === '1'
    const w = isNoteHeader ? 1280 : 1200
    const h = isNoteHeader ? 670 : 630

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#0A0A0A', fontFamily: 'Montserrat', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: '90px', fontWeight: 900, color: '#A1A1AA', letterSpacing: '-0.02em', lineHeight: 1 }}>SOUND IQ</div>
          <div style={{ display: 'flex', fontSize: '120px', fontWeight: 900, color: '#D4D4D8', fontFamily: 'NotoSansJP', lineHeight: 1, marginTop: '40px' }}>あなたの音楽IQは？</div>
          <div style={{ display: 'flex', position: 'absolute', bottom: '40px', right: '60px', fontSize: '28px', fontWeight: 900, color: '#71717a', letterSpacing: '0.02em' }}>created by YANCE</div>
        </div>
      ),
      {
        width: w,
        height: h,
        fonts,
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      },
    )
  }

  // Dynamic score mode (kept for backward compat)
  const score = searchParams.get('score') ?? '0'
  const numScore = parseFloat(score)
  const grade = getGrade(numScore)
  const artist = searchParams.get('artist')
  const headerLabel = artist ? `WHEN? - ${artist}` : `${modeLabel} RESULTS`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#000', padding: '60px 80px', fontFamily: 'Montserrat', position: 'relative' }}>
        <div style={{ display: 'flex', fontSize: '52px', fontWeight: 900, color: '#71717a', letterSpacing: '-0.02em' }}>SOUND IQ</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: artist ? '56px' : '32px', fontWeight: 900, color: accentColor, letterSpacing: '0.08em', fontFamily: 'NotoSansJP' }}>{headerLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '16px' }}>
            <div style={{ display: 'flex', fontSize: '180px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{numScore.toFixed(2)}</div>
            <div style={{ display: 'flex', fontSize: '56px', fontWeight: 900, color: '#52525b', marginLeft: '8px' }}>/100</div>
          </div>
          <div style={{ display: 'flex', fontSize: '80px', fontWeight: 900, color: grade.color, marginTop: '24px' }}>{grade.label}</div>
        </div>
        <div style={{ display: 'flex', position: 'absolute', bottom: '32px', right: '60px', fontSize: '24px', fontWeight: 900, color: '#52525b', letterSpacing: '0.02em' }}>created by YANCE</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  )
}
