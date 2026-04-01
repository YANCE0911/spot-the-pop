import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function getGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'S', color: '#facc15' }
  if (score >= 80) return { label: 'A', color: '#4ade80' }
  if (score >= 70) return { label: 'B', color: '#60a5fa' }
  if (score >= 60) return { label: 'C', color: '#d4d4d8' }
  if (score >= 50) return { label: 'D', color: '#fb923c' }
  return { label: 'E', color: '#f87171' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const score = searchParams.get('score') ?? '0'
  const mode = searchParams.get('mode') ?? 'versus'
  const numScore = parseFloat(score)
  const grade = getGrade(numScore)
  const isTimeline = mode === 'timeline'
  const accentColor = isTimeline ? '#a855f7' : '#1DB954'
  const modeLabel = isTimeline ? 'TIMELINE' : 'VERSUS'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#000',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* SOUND IQ - top left */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 900,
            color: '#a1a1aa',
            letterSpacing: '-0.02em',
          }}
        >
          SOUND IQ
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '16px',
          }}
        >
          {/* MODE RESULTS */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.05em',
            }}
          >
            {modeLabel} RESULTS
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: '180px',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {numScore.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#71717a',
                marginLeft: '8px',
              }}
            >
              /100
            </span>
          </div>

          {/* Grade */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: grade.color,
              marginTop: '8px',
            }}
          >
            {grade.label}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}
