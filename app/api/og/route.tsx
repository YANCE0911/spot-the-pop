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
  const [boldFont, blackFont] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2').then(r => r.arrayBuffer()),
  ])

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
          background: 'linear-gradient(145deg, #0a0a0a 0%, #141414 40%, #0a0a0a 100%)',
          fontFamily: 'Inter',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow behind score */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${grade.color}15 0%, transparent 70%)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
          }}
        >
          <p
            style={{
              color: '#1DB954',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              margin: 0,
            }}
          >
            SPOT THE POP
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
            <span
              style={{
                color: '#fff',
                fontSize: '160px',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {numScore.toFixed(2)}
            </span>
            <span
              style={{
                color: '#444',
                fontSize: '48px',
                fontWeight: 700,
              }}
            >
              /100
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '2px',
                background: '#333',
                display: 'flex',
              }}
            />
            <span
              style={{
                color: grade.color,
                fontSize: '64px',
                fontWeight: 900,
                letterSpacing: '0.05em',
              }}
            >
              {grade.label}
            </span>
            <div
              style={{
                width: '40px',
                height: '2px',
                background: '#333',
                display: 'flex',
              }}
            />
          </div>

          <p
            style={{
              color: '#444',
              fontSize: '22px',
              fontWeight: 500,
              margin: '20px 0 0 0',
              letterSpacing: '0.05em',
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
      fonts: [
        { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
        { name: 'Inter', data: blackFont, weight: 900, style: 'normal' },
      ],
    },
  )
}
