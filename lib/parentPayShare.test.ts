import { describe, it, expect } from 'vitest'
import {
  parentShareText, parentShareSubject, parentShareBody, parentMailto,
} from './parentPayShare'

const URL = 'https://mathsense.app/pay/abc.def'

describe('parent share wording', () => {
  it('names a subscription by default and a pass when asked', () => {
    expect(parentShareText(URL)).toContain('GCSE Maths subscription')
    expect(parentShareText(URL, 'pass')).toContain('GCSE Maths pass')
    expect(parentShareSubject('pass')).toBe('Please help pay for my Mathsense GCSE Maths pass')
  })

  it('always carries the link', () => {
    expect(parentShareText(URL)).toContain(URL)
    expect(parentShareBody(URL)).toContain(URL)
  })

  it('asks rather than demands — the sender is a child messaging an adult', () => {
    expect(parentShareText(URL)).toMatch(/^Please could you help pay/)
    expect(parentShareBody(URL)).toMatch(/^Hi,/)
    expect(parentShareBody(URL)).toContain('Thank you!')
  })
})

describe('parentMailto', () => {
  it('encodes the subject and body so newlines survive the mail client', () => {
    const m = parentMailto(URL)
    expect(m.startsWith('mailto:?subject=')).toBe(true)
    expect(m).toContain('&body=')
    // Raw newlines in a mailto are what truncates the body in some clients.
    expect(m).not.toContain('\n')
    expect(decodeURIComponent(m.split('&body=')[1])).toContain('\n\n')
  })

  it('round-trips the link intact, including its dot-separated token', () => {
    const body = decodeURIComponent(parentMailto(URL).split('&body=')[1])
    expect(body).toContain(URL)
  })
})
