'use client'

/**
 * The one top bar for the public pages — landing, /for-teachers, /guide,
 * /about.
 *
 * Each of those pages used to carry its own copy, which is how the homepage
 * came to offer "Log in" to someone who was already logged in. The point of
 * sharing it is not tidiness: it is that there is now a single place where the
 * question "is anyone signed in?" gets asked, so no page can forget to ask.
 *
 * `audience` only changes what a SIGNED-OUT visitor is offered: the student
 * pages lead with practice, the teacher pages lead with the teacher login. A
 * signed-in visitor is shown the same thing everywhere — their name and the
 * way back to their own dashboard — because that is what was missing.
 */

import Link from 'next/link'
import { trackEvent } from '../lib/analytics'
import { colors, font, radius, SITE_NAV_HEIGHT } from '../lib/styles'
import { dashboardPath, useAccountNav } from '../lib/useAccountNav'

const barStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${colors.border}`,
  padding: '0 24px',
  height: SITE_NAV_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const linkStyle: React.CSSProperties = {
  fontSize: font.sm,
  color: colors.textSecondary,
  textDecoration: 'none',
  fontWeight: '500',
  padding: '8px 12px',
}

const primaryStyle: React.CSSProperties = {
  background: colors.primary,
  color: '#fff',
  borderRadius: radius.md,
  padding: '8px 16px',
  fontSize: font.sm,
  fontWeight: '700',
  textDecoration: 'none',
}

/** First name only: a nav is not the place for someone's full name. */
function firstName(displayName: string): string {
  return displayName.split(/\s+/)[0]
}

export default function SiteNav({ audience = 'student' }: {
  /** Who the SIGNED-OUT calls to action are aimed at. Default: students. */
  audience?: 'student' | 'teacher'
}) {
  const account = useAccountNav()

  const signedOutLinks = audience === 'teacher' ? (
    <>
      <Link href="/student" style={linkStyle}>Student login</Link>
      <Link href="/auth" style={primaryStyle}>Teacher login</Link>
    </>
  ) : (
    <>
      <Link href="/for-teachers" style={linkStyle}>For teachers</Link>
      <Link href="/student" style={linkStyle}>Log in</Link>
      <Link href="/practice" onClick={() => trackEvent('nav_practice_clicked')} style={primaryStyle}>
        Start practising free
      </Link>
    </>
  )

  return (
    <nav style={barStyle}>
      <Link href="/" style={{
        fontSize: font.xl,
        fontWeight: '800',
        color: colors.primary,
        textDecoration: 'none',
        letterSpacing: '-0.02em',
      }}>
        Mathsense
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {account.state === 'signedIn' ? (
          <>
            {account.displayName && (
              <span style={{
                fontSize: font.sm,
                color: colors.textSecondary,
                fontWeight: '500',
                maxWidth: '110px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {firstName(account.displayName)}
              </span>
            )}
            {account.role === 'student' && (
              <Link href="/practice" onClick={() => trackEvent('nav_practice_clicked')} style={linkStyle}>
                Practise
              </Link>
            )}
            <Link
              href={dashboardPath(account.role)}
              onClick={() => trackEvent('nav_dashboard_clicked', { role: account.role })}
              style={primaryStyle}
            >
              {account.role === 'unknown' ? 'My account' : 'My dashboard'}
            </Link>
          </>
        ) : (
          /*
            Both `loading` and `signedOut` get the signed-out chrome, and that is
            deliberate. Auth can only be answered after hydration here (the
            landing page is served from the CDN), and hiding the links until
            then would blank the page’s main call to action for as long as it
            takes the bundle to load — seconds on a phone, for the signed-out
            majority who were never the problem. A signed-in visitor sees the
            signed-out set for one beat instead; that is the cheaper mistake.
          */
          signedOutLinks
        )}
      </div>
    </nav>
  )
}
