import { describe, it, expect } from 'vitest'
import { referrerHost } from './referrer'

/**
 * The referrer rules, tested rather than assumed.
 *
 * This is the only record of where a visit came from now that Google Analytics
 * has gone, so a quiet mistake here reads as "everyone arrived directly" and the
 * 21 October baseline would be answered wrongly rather than not at all.
 */

const SELF = 'mathsense.net'

describe('referrerHost — what it records', () => {
  it('records the host a search sent them from', () => {
    expect(referrerHost('https://www.google.com/search?q=gcse+maths', SELF)).toBe('www.google.com')
  })

  it('records a shared link from another site', () => {
    expect(referrerHost('https://www.reddit.com/r/GCSE/comments/abc', SELF)).toBe('www.reddit.com')
  })

  it('lower-cases the host so one source is one row', () => {
    expect(referrerHost('https://WWW.Google.COM/search', SELF)).toBe('www.google.com')
  })
})

describe('referrerHost — what it deliberately drops', () => {
  it('drops the path and query entirely', () => {
    // The whole reason this returns a host: a full referrer carries the other
    // site's query string, which can hold anything they put in it — including a
    // search term, which is somebody's words and none of our business.
    const out = referrerHost('https://www.google.com/search?q=something+personal', SELF)
    expect(out).toBe('www.google.com')
    expect(out).not.toContain('something')
    expect(out).not.toContain('?')
  })

  it('returns null for our own host — internal navigation is not an arrival', () => {
    expect(referrerHost('https://mathsense.net/practice', SELF)).toBeNull()
  })

  it('treats www as the same site', () => {
    expect(referrerHost('https://www.mathsense.net/practice', SELF)).toBeNull()
    expect(referrerHost('https://mathsense.net/practice', 'www.mathsense.net')).toBeNull()
  })

  it('returns null when there is no referrer', () => {
    // Direct, or a browser that stripped it. Indistinguishable from here, so
    // nothing is recorded rather than guessing at "direct".
    expect(referrerHost('', SELF)).toBeNull()
    expect(referrerHost(null, SELF)).toBeNull()
    expect(referrerHost(undefined, SELF)).toBeNull()
  })

  it('returns null rather than throwing on an unparseable referrer', () => {
    // document.referrer is whatever the browser hands us. A throw here would
    // take down captureAttribution, and with it every event on the page.
    expect(referrerHost('not a url', SELF)).toBeNull()
    expect(referrerHost('://broken', SELF)).toBeNull()
  })
})

describe('referrerHost — things that should still count', () => {
  it('counts a different subdomain of our own domain as external', () => {
    // A link from a blog or docs subdomain IS an arrival worth seeing, and the
    // www rule above is deliberately narrow so this still registers.
    expect(referrerHost('https://blog.mathsense.net/post', SELF)).toBe('blog.mathsense.net')
  })

  it('handles a bare http referrer', () => {
    expect(referrerHost('http://example.sch.uk/links', SELF)).toBe('example.sch.uk')
  })
})
