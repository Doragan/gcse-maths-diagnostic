import { ImageResponse } from 'next/og'

// Branded favicon (replaces the stock app/favicon.ico). A white "M" monogram on
// the brand-blue rounded square. Rendered server-side so the glyph is crisp and
// font-independent. Swap for a real logo here if/when one exists.
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: 7,
          color: '#ffffff',
          fontSize: 23,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        M
      </div>
    ),
    { ...size },
  )
}
