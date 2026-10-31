import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  DEMO_SEED_MARKER, DEMO_SEED_PATTERN, isDemoSeedName, demoSeedStudentIds,
} from './demoSeed'

describe('the demo-seed marker', () => {
  it('matches both seed shapes', () => {
    // The seed writes 'demo-seed' for the 1:1 shape and 'demo-seed-class' for
    // the class shape. A filter that matched only the first would quietly keep
    // the second, which is the shape that caused the problem.
    expect(isDemoSeedName('Ava demo-seed')).toBe(true)
    expect(isDemoSeedName('Ava demo-seed-class')).toBe(true)
    expect(isDemoSeedName('Ava')).toBe(false)
    expect(isDemoSeedName(null)).toBe(false)
    expect(isDemoSeedName(undefined)).toBe(false)
  })

  it('agrees with the marker the seed script actually writes', () => {
    // The seed owns the string; this module only mirrors it. If the script
    // changes its marker, every exclusion below silently stops working, so the
    // two are compared rather than assumed to match.
    const script = readFileSync(join(process.cwd(), 'scripts', 'seed-demo-class.ts'), 'utf8')
    const markers = [...script.matchAll(/'(demo-seed[a-z-]*)'/g)].map(m => m[1])
    expect(markers.length, 'marker literals in the seed script').toBeGreaterThan(0)
    for (const m of markers) {
      expect(m.startsWith(DEMO_SEED_MARKER), `${m} does not start with ${DEMO_SEED_MARKER}`).toBe(true)
    }
  })

  it('survives the id lookup failing, rather than taking a report down', () => {
    // A usage report that is briefly inflated beats a morning email that does
    // not arrive.
    const failing = {
      from: () => ({
        select: () => ({ ilike: async () => ({ data: null, error: { message: 'boom' } }) }),
      }),
    }
    return demoSeedStudentIds(failing as never).then(ids => {
      expect(ids.size).toBe(0)
    })
  })
})

describe('everything that counts students excludes the seed', () => {
  // The regression this exists to prevent: on 2026-10-18 the class-shaped seed
  // landed and the daily digest reported "practised in the last 7 days: 12"
  // when three were real. The seed backdates ~40 attempts per student, so it
  // does not merely inflate a total — it looks like activity inside the very
  // window a usage report measures.
  const SURFACES = [
    ['lib/email/dailyDigestData.ts', 'the daily digest email'],
    ['app/api/admin/usage/route.ts', 'the admin usage report'],
  ] as const

  it.each(SURFACES)('%s (%s) references the shared exclusion', path => {
    const src = readFileSync(join(process.cwd(), path), 'utf8')
    expect(src, `${path} does not import from lib/demoSeed`).toMatch(/demoSeed/)
    // Must actually USE it, not merely import it.
    expect(
      /DEMO_SEED_PATTERN|demoSeedStudentIds/.test(src),
      `${path} imports the exclusion but never applies it`,
    ).toBe(true)
  })

  it('keeps the pattern in the form PostgREST needs', () => {
    expect(DEMO_SEED_PATTERN).toBe('%demo-seed%')
  })
})
