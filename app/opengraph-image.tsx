import { ImageResponse } from 'next/og'

// Social preview card. Next.js automatically wires this into <meta og:image>
// (and the Twitter card) for every route that doesn't override it, so any
// shared Mathsense link unfurls with a branded image.
//
// The design mirrors the product: a headline on the left, and a mock question
// card on the right showing the instant-feedback loop (a "Correct" pill + the
// mastery dots), so the preview reads as the actual app rather than plain text.
export const runtime = 'edge'
export const alt = 'Mathsense — GCSE Maths practice with instant feedback'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  // Mastery dots: 3 correct (green), 2 remaining (grey) — the app's progress motif.
  const dots = ['#4CAF50', '#4CAF50', '#4CAF50', '#e5e7eb', '#e5e7eb']

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '72px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, color: '#ffffff' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, opacity: 0.92 }}>
            Mathsense
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              marginTop: 22,
            }}
          >
            GCSE Maths practice with instant feedback
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              marginTop: 32,
              padding: '10px 22px',
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.18)',
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Free to try — no signup needed
          </div>
        </div>

        {/* Right: mock question card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 460,
            background: '#ffffff',
            borderRadius: 20,
            padding: 36,
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: '#6b7280' }}>
            Quadratic equations
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 700,
              color: '#111827',
              marginTop: 14,
            }}
          >
            Solve x² + 5x + 6 = 0
          </div>

          {/* Correct pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: 28,
              padding: '12px 22px',
              borderRadius: 12,
              background: '#e8f5e9',
              color: '#2e7d32',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Correct!  x = −2, −3
          </div>

          {/* Mastery dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
            {dots.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', width: 22, height: 22, borderRadius: 11, background: c }}
              />
            ))}
            <div style={{ display: 'flex', marginLeft: 10, fontSize: 22, color: '#6b7280' }}>
              3 / 5 to mastery
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
