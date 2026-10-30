import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// Every <GuideLink anchor="…"> must point at a real id in app/guide/page.tsx.
//
// WHY THIS IS WORTH A TEST. A wrong anchor does not throw, 404 or warn: the
// browser simply lands at the top of the guide, which looks exactly like a link
// that worked. The failure is invisible to whoever makes it and only shows up
// as a teacher saying "it didn't explain anything", which nobody ever reports.
//
// It also pins the ids themselves. They were described in the guide's own
// header as "this page's API"; this is what makes that true, so renaming a
// heading's id breaks a test rather than quietly breaking every link to it.
//
// Same shape as accountCourse.test.ts, which parses a migration to stop the
// CHECK list drifting from data/courses.ts.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = join(__dirname, '..')
const GUIDE = join(ROOT, 'app', 'guide', 'page.tsx')

/** Every `id="…"` the guide page defines. */
function guideAnchors(): Set<string> {
  const src = readFileSync(GUIDE, 'utf8')
  const ids = new Set<string>()
  for (const m of src.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1])
  return ids
}

/** Every `.tsx` under app/ and components/, skipping build output. */
function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.tsx')) out.push(full)
    }
  }
  walk(join(ROOT, 'app'))
  walk(join(ROOT, 'components'))
  return out
}

/** Every anchor passed to a GuideLink, with the file it came from. */
function usedAnchors(): { file: string; anchor: string }[] {
  const hits: { file: string; anchor: string }[] = []
  for (const file of sourceFiles()) {
    const src = readFileSync(file, 'utf8')
    if (!src.includes('<GuideLink')) continue
    for (const m of src.matchAll(/<GuideLink\b[^>]*?\banchor="([^"]+)"/g)) {
      hits.push({ file: file.slice(ROOT.length + 1).replace(/\\/g, '/'), anchor: m[1] })
    }
  }
  return hits
}

describe('GuideLink anchors', () => {
  it('the guide defines the ids the rest of the app links to', () => {
    const ids = guideAnchors()
    // A guard on the guard: if the page is ever restructured into something
    // this regex cannot read, every other assertion here would pass vacuously.
    expect(ids.size).toBeGreaterThan(5)
  })

  it('every GuideLink points at an id that exists', () => {
    const ids = guideAnchors()
    const broken = usedAnchors().filter(u => !ids.has(u.anchor))
    expect(
      broken.map(b => `${b.file} -> #${b.anchor}`),
      'anchors with no matching id in app/guide/page.tsx',
    ).toEqual([])
  })

  it('the links have not all quietly disappeared', () => {
    // Deleting every GuideLink would make the test above pass on an empty set.
    // The point of the component is that the screens carry these, so assert
    // they are still there — and on more than one screen.
    const used = usedAnchors()
    expect(used.length).toBeGreaterThanOrEqual(4)
    expect(new Set(used.map(u => u.file)).size).toBeGreaterThanOrEqual(4)
  })
})
