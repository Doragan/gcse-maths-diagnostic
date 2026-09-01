import { describe, it, expect } from 'vitest'
import { parseSendKind, SEND_TABLE, SEND_DESTINATION, SEND_ANALYTICS } from './sendKind'

describe('parseSendKind', () => {
  it('recognises the nudge channel', () => {
    expect(parseSendKind('nudge')).toBe('nudge')
  })

  it('defaults to re-engagement when absent, so links already in inboxes keep working', () => {
    // The re-engagement email shipped before `k` existed; its live links have
    // no channel parameter and must still resolve.
    expect(parseSendKind(null)).toBe('reengagement')
    expect(parseSendKind(undefined)).toBe('reengagement')
    expect(parseSendKind('')).toBe('reengagement')
  })

  it('never passes an unrecognised value through', () => {
    // `k` chooses a table, so anything not on the allowlist must collapse to a
    // known channel rather than reach a query.
    for (const junk of ['weekly_nudge_sends', 'students', '../admin', 'NUDGE', 'nudge; drop table']) {
      expect(parseSendKind(junk)).toBe('reengagement')
    }
  })
})

describe('channel maps', () => {
  it('covers every channel parseSendKind can return', () => {
    for (const kind of ['reengagement', 'nudge'] as const) {
      expect(SEND_TABLE[kind]).toBeTruthy()
      expect(SEND_DESTINATION[kind]).toBeTruthy()
      expect(SEND_ANALYTICS[kind].path).toBeTruthy()
      expect(SEND_ANALYTICS[kind].prefix).toBeTruthy()
    }
  })

  it('keeps the two channels on separate ledgers and separate funnels', () => {
    // Sharing a ledger would let one channel's frequency cap suppress the other.
    expect(SEND_TABLE.reengagement).not.toBe(SEND_TABLE.nudge)
    expect(SEND_ANALYTICS.reengagement.prefix).not.toBe(SEND_ANALYTICS.nudge.prefix)
  })

  it('sends the lapsed to the dashboard and the active to practice', () => {
    expect(SEND_DESTINATION.reengagement).toBe('/student/dashboard')
    expect(SEND_DESTINATION.nudge).toBe('/practice')
  })

  it('destinations are same-origin paths, never absolute URLs', () => {
    // The click route joins these onto NEXT_PUBLIC_SITE_URL. An absolute URL
    // here would turn that redirect into an off-site one.
    for (const dest of Object.values(SEND_DESTINATION)) {
      expect(dest.startsWith('/')).toBe(true)
      expect(dest.startsWith('//')).toBe(false)
      expect(dest).not.toMatch(/^https?:/i)
    }
  })
})
