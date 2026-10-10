import { describe, it, expect } from 'vitest'
import {
  parseEmailList, invitationState, acceptedElsewhere, invitationEmail, acceptUrl,
  safeNext, STATE_LABEL, MAX_EMAILS,
} from './invitations'

describe('safeNext', () => {
  it('accepts an invitation path', () => {
    expect(safeNext('/invite/abc123')).toBe('/invite/abc123')
    expect(safeNext('/invite/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBeTruthy()
    // Percent-encoded, as acceptUrl emits.
    expect(safeNext('/invite/a%2Fb')).toBe('/invite/a%2Fb')
  })

  it('returns null for nothing', () => {
    expect(safeNext(null)).toBeNull()
    expect(safeNext(undefined)).toBeNull()
    expect(safeNext('')).toBeNull()
  })

  it('refuses a protocol-relative url, the bypass a "starts with /" test misses', () => {
    // `//evil.example` IS relative by the naive test and IS an absolute
    // cross-origin navigation in a browser. This guards a sign-in page.
    for (const hostile of ['//evil.example', '//evil.example/invite/x', '///evil.example', '/\\evil.example']) {
      expect(safeNext(hostile)).toBeNull()
    }
  })

  it('refuses absolute urls and other schemes', () => {
    for (const hostile of [
      'https://evil.example/invite/x',
      'http://localhost:3000/invite/x',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'JaVaScRiPt:alert(1)',
    ]) {
      expect(safeNext(hostile)).toBeNull()
    }
  })

  it('refuses any internal path that is not an invitation', () => {
    // Narrow on purpose: an allowlist of one shape cannot be widened by
    // accident, and nothing else needs it.
    for (const other of ['/dashboard', '/student/dashboard', '/admin', '/', '/invite', '/invite/']) {
      expect(safeNext(other)).toBeNull()
    }
  })

  it('refuses traversal, queries and fragments hidden in the token', () => {
    for (const hostile of [
      '/invite/../admin',
      '/invite/x/../../admin',
      '/invite/x?next=//evil.example',
      '/invite/x#@evil.example',
      '/invite/x@evil.example',
      '/invite/x\\..\\admin',
    ]) {
      expect(safeNext(hostile)).toBeNull()
    }
  })
})

describe('parseEmailList', () => {
  it('accepts the separators a pasted class list actually arrives with', () => {
    const { valid } = parseEmailList('a@x.sch.uk, b@x.sch.uk; c@x.sch.uk\nd@x.sch.uk e@x.sch.uk')
    expect(valid).toEqual(['a@x.sch.uk', 'b@x.sch.uk', 'c@x.sch.uk', 'd@x.sch.uk', 'e@x.sch.uk'])
  })

  it('lower-cases, because the unique index is on the raw text', () => {
    // Without this one pupil could hold two invitations by capitalisation
    // alone — the schema CHECK (email = lower(email)) is the backstop.
    const { valid } = parseEmailList('A.Pupil@School.SCH.UK')
    expect(valid).toEqual(['a.pupil@school.sch.uk'])
  })

  it('de-duplicates after lower-casing, not before', () => {
    const { valid } = parseEmailList('a@x.uk, A@X.uk, a@x.uk')
    expect(valid).toEqual(['a@x.uk'])
  })

  it('separates implausible entries instead of silently dropping them', () => {
    // A teacher who pastes a list with one broken entry needs to be told which
    // one, or they will believe all thirty landed.
    const { valid, rejected } = parseEmailList('good@x.uk, not-an-email, also bad@, @nope')
    expect(valid).toEqual(['good@x.uk'])
    expect(rejected).toEqual(['not-an-email', 'also', 'bad@', '@nope'])
  })

  it('returns nothing for empty or whitespace-only input', () => {
    for (const raw of ['', '   ', '\n\n', ' , ; ']) {
      expect(parseEmailList(raw)).toEqual({ valid: [], rejected: [] })
    }
  })

  it('caps nothing itself — MAX_EMAILS is the route\'s to enforce', () => {
    // Documents the split of responsibility: parsing is pure, the limit is a
    // request concern. If this ever changes, the route must change with it.
    const many = Array.from({ length: MAX_EMAILS + 5 }, (_, i) => `p${i}@x.uk`).join(' ')
    expect(parseEmailList(many).valid).toHaveLength(MAX_EMAILS + 5)
  })
})

describe('invitationState', () => {
  const now = new Date('2026-10-10T12:00:00Z')
  const future = '2027-01-01T00:00:00Z'
  const past = '2026-01-01T00:00:00Z'

  it('reports an accepted invitation as joined regardless of delivery or expiry', () => {
    // A pupil who joined, joined. An expired-but-accepted row must not read as
    // a straggler, or the tutor chases someone already in the class.
    expect(invitationState({ status: 'accepted', expires_at: past, sent_at: null }, now)).toBe('joined')
  })

  it('distinguishes "never sent" from "sent and waiting"', () => {
    // The whole point of the sent_at column. These two call for completely
    // different actions: fix the mail configuration, versus chase the pupil.
    expect(invitationState({ status: 'pending', expires_at: future, sent_at: null }, now)).toBe('not_sent')
    expect(invitationState({ status: 'pending', expires_at: future, sent_at: past }, now)).toBe('waiting')
  })

  it('reports expiry ahead of non-delivery, because re-invite is the fix either way', () => {
    expect(invitationState({ status: 'pending', expires_at: past, sent_at: null }, now)).toBe('expired')
    expect(invitationState({ status: 'pending', expires_at: past, sent_at: past }, now)).toBe('expired')
  })

  it('treats the expiry instant itself as expired', () => {
    expect(invitationState(
      { status: 'pending', expires_at: now.toISOString(), sent_at: past }, now,
    )).toBe('expired')
  })

  it('reports a revoked invitation as withdrawn, not as a straggler', () => {
    expect(invitationState({ status: 'revoked', expires_at: future, sent_at: past }, now)).toBe('withdrawn')
  })

  it('has a label for every state it can return', () => {
    const states = ['joined', 'waiting', 'not_sent', 'expired', 'withdrawn'] as const
    for (const s of states) expect(STATE_LABEL[s]).toBeTruthy()
  })
})

describe('acceptedElsewhere', () => {
  it('is false when nobody has accepted yet', () => {
    expect(acceptedElsewhere('a@school.uk', null)).toBe(false)
  })

  it('is false for the same address in different case or with stray spacing', () => {
    expect(acceptedElsewhere('a@school.uk', 'A@School.UK')).toBe(false)
    expect(acceptedElsewhere(' a@school.uk ', 'a@school.uk')).toBe(false)
  })

  it('is true when a pupil signed up with a different address', () => {
    // The expected case, not an anomaly: a school address invited, a personal
    // one used. It is shown so the teacher's roster reconciles.
    expect(acceptedElsewhere('a.pupil@school.uk', 'amara@gmail.com')).toBe(true)
  })
})

describe('invitationEmail', () => {
  const url = 'https://mathsense.net/invite/abc123'

  it('names the class and the teacher in the subject', () => {
    const { subject } = invitationEmail({ className: '9B Maths', teacherName: 'Mr Okafor', acceptUrl: url })
    expect(subject).toContain('9B Maths')
    expect(subject).toContain('Mr Okafor')
  })

  it('falls back to "Your teacher" rather than an empty name', () => {
    for (const name of [null, '', '   ']) {
      const { subject, text } = invitationEmail({ className: '9B', teacherName: name, acceptUrl: url })
      expect(subject).toContain('Your teacher')
      expect(text).not.toContain('undefined')
      expect(text).not.toContain('null')
    }
  })

  it('carries the link', () => {
    expect(invitationEmail({ className: '9B', teacherName: 'T', acceptUrl: url }).text).toContain(url)
  })

  it('tells the recipient they need not use the invited address', () => {
    // This sentence is the fix for the bug that got the feature reverted. A
    // pupil who signs up with a personal address must not be left guessing.
    const { text } = invitationEmail({ className: '9B', teacherName: 'T', acceptUrl: url })
    expect(text).toMatch(/does not have to\s+be the one this was sent to/)
  })

  it('says what the teacher can and cannot see', () => {
    const { text } = invitationEmail({ className: '9B', teacherName: 'T', acceptUrl: url })
    expect(text).toContain('cannot see your password')
    expect(text).toMatch(/leave the class/)
  })

  it('applies no pressure, because accepting is the consent the model rests on', () => {
    // Deadline and urgency language would undermine the one freely-given act
    // that makes teacher visibility lawful. Guard it so nobody "improves" the
    // conversion rate here later without reading the reasoning.
    const { subject, text } = invitationEmail({ className: '9B', teacherName: 'T', acceptUrl: url })
    const whole = `${subject}\n${text}`.toLowerCase()
    for (const pressure of ['action required', 'expires', 'urgent', 'immediately', 'don\'t miss', 'last chance', 'hurry']) {
      expect(whole).not.toContain(pressure)
    }
  })

  it('does not claim the link itself joins them', () => {
    // Following the link joins nobody — they still create an account and press
    // a button. Saying otherwise would misdescribe the only step that matters.
    const { text } = invitationEmail({ className: '9B', teacherName: 'T', acceptUrl: url })
    expect(text.toLowerCase()).not.toContain('click to join')
    expect(text).toMatch(/Nothing\s+happens unless you accept/)
  })
})

describe('acceptUrl', () => {
  it('puts the token in the path, not the query string', () => {
    // Mail clients rewrite and truncate query params; the path survives. It
    // also keeps it clearly distinct from the join code's ?code=.
    expect(acceptUrl('https://mathsense.net', 'tok123')).toBe('https://mathsense.net/invite/tok123')
  })

  it('tolerates a trailing slash on the origin', () => {
    expect(acceptUrl('https://mathsense.net/', 'tok123')).toBe('https://mathsense.net/invite/tok123')
  })

  it('escapes anything that would break out of the path segment', () => {
    expect(acceptUrl('https://mathsense.net', 'a/b?c=d')).toBe('https://mathsense.net/invite/a%2Fb%3Fc%3Dd')
  })
})
