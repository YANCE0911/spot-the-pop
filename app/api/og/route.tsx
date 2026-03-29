import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function getGrade(score: number): { label: string; color: string } {
  if (score >= 95) return { label: 'S', color: '#1DB954' }
  if (score >= 85) return { label: 'A', color: '#34d399' }
  if (score >= 70) return { label: 'B', color: '#38bdf8' }
  if (score >= 50) return { label: 'C', color: '#fbbf24' }
  return { label: 'D', color: '#f87171' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const score = searchParams.get('score') ?? '0'
  const numScore = parseFloat(score)
  const grade = getGrade(numScore)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000 0%, #111 50%, #000 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <p
            style={{
              color: '#1DB954',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              margin: 0,
            }}
          >
            SPOT THE POP
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                color: '#fff',
                fontSize: '140px',
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {numScore.toFixed(2)}
            </span>
            <span
              style={{
                color: '#666',
                fontSize: '48px',
                fontWeight: 700,
              }}
            >
              /100
            </span>
          </div>

          <span
            style={{
              color: grade.color,
              fontSize: '72px',
              fontWeight: 900,
            }}
          >
            {grade.label}
          </span>

          <p
            style={{
              color: '#555',
              fontSize: '24px',
              margin: '16px 0 0 0',
            }}
          >
            Can you beat this score?
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
