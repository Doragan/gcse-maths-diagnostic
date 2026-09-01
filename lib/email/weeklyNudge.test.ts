import { describe, it, expect } from 'vitest'
import { buildWeeklyNudgeEmail, nudgeActiveDays } from './weeklyNudge'

const base = {
  displayName: 'Jamie Smith',
  answered: 7,
  goal: 10,
  practiceUrl: 'https://mathsense.net/api/email/click?s=abc&k=nudge',
  unsubscribeUrl: 'https://mathsense.net/api/email/unsubscribe?s=abc&k=nudge',
}

describe('buildWeeklyNudgeEmail', () => {
  it('greets by first name only and puts the shortfall in the subject', () => {
    const { subject, html, text } = buildWeeklyNudgeEmail(base)
    expect(subject).toBe('Nice work this week, Jamie — 3 questions to go')
    expect(html).toContain('Hi Jamie,')
    expect(text).toContain('Hi Jamie,')
    expect(html).not.toContain('Hi Jamie Smith')
  })

  it('falls back to a neutral greeting and subject with no name', () => {
    const { subject, html } = buildWeeklyNudgeEmail({ ...base, displayName: '' })
    expect(subject).toBe('Nice work this week — 3 questions to go')
    expect(html).toContain('Hi there,')
  })

  it('states what they have done before what they have not', () => {
    const { text } = buildWeeklyNudgeEmail(base)
    expect(text.indexOf('You’ve answered 7 questions')).toBeLessThan(text.indexOf('That leaves'))
  })

  it('reads as singular at one question, both directions', () => {
    const { subject, html } = buildWeeklyNudgeEmail({ ...base, answered: 9 })
    expect(subject).toContain('1 question to go')
    expect(subject).not.toContain('1 questions')
    expect(buildWeeklyNudgeEmail({ ...base, answered: 1 }).html).toContain('1 question on Mathsense')
  })

  it('respects a goal other than 10 rather than hardcoding it', () => {
    const { html } = buildWeeklyNudgeEmail({ ...base, answered: 4, goal: 20 })
    expect(html).toContain('weekly goal of 20')
    expect(html).toContain('16 questions')
  })

  it('never reports a negative shortfall', () => {
    const { subject } = buildWeeklyNudgeEmail({ ...base, answered: 14 })
    expect(subject).toContain('0 questions to go')
    expect(subject).not.toContain('-')
  })
})

describe('buildWeeklyNudgeEmail — no pressure mechanics', () => {
  // These are the guardrails, not decoration: this email goes to children, and
  // the whole point of the weekly goal was to stop treating a missed period as
  // a failure. A future edit that reintroduces urgency should fail here.
  const variants = [
    buildWeeklyNudgeEmail(base),
    buildWeeklyNudgeEmail({ ...base, answered: 9 }),
    buildWeeklyNudgeEmail({ ...base, displayName: '' }),
  ]

  it('never mentions a deadline or a countdown', () => {
    for (const { subject, html, text } of variants) {
      for (const body of [subject, html, text]) {
        expect(body).not.toMatch(/days? left|last chance|hurry|deadline|expires?|running out|before (?:it|the week) ends|ends (?:today|tonight|soon)/i)
      }
    }
  })

  it('never mentions the streak — a streak named in a nudge is a streak to lose', () => {
    for (const { subject, html, text } of variants) {
      for (const body of [subject, html, text]) {
        expect(body).not.toMatch(/streak/i)
      }
    }
  })

  it('never uses loss or guilt framing', () => {
    for (const { subject, html, text } of variants) {
      for (const body of [subject, html, text]) {
        expect(body).not.toMatch(/don'?t lose|you'?ll lose|miss out|falling behind|let(?:ting)? yourself down|disappoint/i)
      }
    }
  })

  it('says a missed week costs nothing, in every variant', () => {
    for (const { html, text } of variants) {
      expect(html).toContain('starts fresh every Monday')
      expect(text).toContain('doesn’t undo anything you’ve already learned')
    }
  })
})

describe('buildWeeklyNudgeEmail — consent and safety', () => {
  it('carries the reason-for-receipt and a one-click unsubscribe in both parts', () => {
    const { html, text } = buildWeeklyNudgeEmail(base)
    for (const body of [html, text]) {
      expect(body).toContain('you turned on practice reminders')
    }
    // The plain-text part carries the URL verbatim; the HTML part carries it
    // HTML-escaped, which matters now that these links have a second query
    // parameter — a raw "&" in an href is invalid markup.
    expect(text).toContain(base.unsubscribeUrl)
    expect(html).toContain(base.unsubscribeUrl.replace(/&/g, '&amp;'))
  })

  it('escapes markup in the display name', () => {
    const { html } = buildWeeklyNudgeEmail({ ...base, displayName: '<img src=x onerror=alert(1)>' })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('escapes the URLs it interpolates', () => {
    const { html } = buildWeeklyNudgeEmail({ ...base, practiceUrl: 'https://x.test/?a=1&b="2"' })
    expect(html).toContain('a=1&amp;b=&quot;2&quot;')
  })
})

describe('nudgeActiveDays — the two crons must not both claim a student', () => {
  it('is strictly tighter than the lapsed threshold', () => {
    for (const lapsed of [2, 3, 4, 7, 14]) {
      expect(nudgeActiveDays(lapsed)).toBeLessThan(lapsed)
    }
  })

  it('never returns a useless window, even for an absurd setting', () => {
    for (const lapsed of [1, 0, -5]) {
      expect(nudgeActiveDays(lapsed)).toBeGreaterThanOrEqual(1)
    }
  })

  it('leaves no student qualifying for both emails, at any pair of run times', () => {
    // The bug this exists to prevent: each cron measures its window back from
    // its OWN start time, so with equal thresholds a student whose last attempt
    // falls between the two run instants is simultaneously "active" and
    // "lapsed", and gets two emails the same day.
    const DAY = 86400000
    const lapsedDays = 4
    const activeDays = nudgeActiveDays(lapsedDays)

    for (let nudgeHour = 0; nudgeHour < 24; nudgeHour++) {
      for (let lapsedHour = 0; lapsedHour < 24; lapsedHour++) {
        const nudgeRun  = Date.UTC(2026, 8, 5, nudgeHour)
        const lapsedRun = Date.UTC(2026, 8, 5, lapsedHour)
        // Earliest attempt the nudge accepts, and latest the lapsed check accepts.
        const activeFrom = nudgeRun - activeDays * DAY
        const lapsedBefore = lapsedRun - lapsedDays * DAY
        // No instant may satisfy both (attempt >= activeFrom AND attempt < lapsedBefore).
        expect(activeFrom).toBeGreaterThanOrEqual(lapsedBefore)
      }
    }
  })

  it('equal thresholds WOULD overlap — the property above is not vacuous', () => {
    const DAY = 86400000
    const nudgeRun  = Date.UTC(2026, 8, 5, 10)
    const lapsedRun = Date.UTC(2026, 8, 5, 16)
    expect(nudgeRun - 4 * DAY).toBeLessThan(lapsedRun - 4 * DAY)
  })
})
