'use client'

import Link from 'next/link'
import { colors, font } from '../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// A quiet link from a screen to the part of /guide that explains it.
//
// WHY THESE EXIST AT ALL. The guide was built as a page rather than a PDF for
// exactly this: a document someone is emailed is read once, if at all, while a
// link is read at the moment of confusion. Every anchor in app/guide/page.tsx
// answers a question somebody asks while looking at one specific screen, so
// each of those screens should offer it.
//
// ⚠ THE ANCHOR IS A CONTRACT. `anchor` must match an `id` in
// app/guide/page.tsx — nothing checks it at build time, and a typo degrades
// silently to "the top of the guide", which looks like it worked. The ids in
// use are listed in that file's header; `guideLinks.test.ts` fails if one here
// has no matching id there.
//
// DELIBERATELY UNDERSTATED. A teacher who knows what they are doing should be
// able to ignore these completely: small, secondary colour, no icon badge, no
// box. They are a handrail, not a feature.
// ─────────────────────────────────────────────────────────────────────────────

export default function GuideLink({
  anchor,
  children = 'How this works',
}: {
  /** The id to jump to in app/guide/page.tsx, with no leading '#'. */
  anchor: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={`/guide#${anchor}`}
      style={{
        fontSize: font.sm,
        fontWeight: '500',
        color: colors.textSecondary,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children} <span aria-hidden="true">↗</span>
    </Link>
  )
}
