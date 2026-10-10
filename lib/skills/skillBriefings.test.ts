import { describe, it, expect } from 'vitest'
import { getBriefing, hasBriefing, resolveBriefing, skillBriefings } from '../../data/skillBriefings'
import { skillsById } from './skillGraph'
import { skillIdToSlug, slugToSkillId } from './slug'

describe('skill guide registry', () => {
  it('only registers guides for real skills', () => {
    for (const skillId of Object.keys(skillBriefings)) {
      expect(skillsById[skillId], `${skillId} is not a skill in data/skills.ts`).toBeDefined()
    }
  })

  it('reports guides that do not exist as absent', () => {
    expect(hasBriefing('proportion')).toBe(true)
    expect(hasBriefing('completely_made_up_skill')).toBe(false)
    expect(getBriefing('completely_made_up_skill')).toBeNull()
  })

  it('points every confusable and near-miss at a real skill', () => {
    for (const guide of Object.values(skillBriefings)) {
      const referenced = [
        ...guide.confusableWith.map(c => c.skillId),
        ...guide.examples.flatMap(e => (e.actuallySkillId ? [e.actuallySkillId] : [])),
        ...(guide.higher?.confusableWith ?? []).map(c => c.skillId),
        ...(guide.higher?.examples ?? []).flatMap(e => (e.actuallySkillId ? [e.actuallySkillId] : [])),
      ]
      for (const id of referenced) {
        expect(skillsById[id], `${guide.skillId} references unknown skill ${id}`).toBeDefined()
      }
    }
  })

  it('never lists a skill as confusable with itself', () => {
    for (const guide of Object.values(skillBriefings)) {
      const all = [...guide.confusableWith, ...(guide.higher?.confusableWith ?? [])]
      for (const c of all) {
        expect(c.skillId, `${guide.skillId} is confusable with itself`).not.toBe(guide.skillId)
      }
    }
  })

  it('fills both halves of every comparison', () => {
    // A comparison with an empty side renders a labelled row with nothing
    // against it, which reads as a bug rather than as guidance.
    for (const guide of Object.values(skillBriefings)) {
      const all = [...guide.confusableWith, ...(guide.higher?.confusableWith ?? [])]
      for (const c of all) {
        expect(c.thisOne?.trim(), `${guide.skillId} vs ${c.skillId}: thisOne empty`).toBeTruthy()
        expect(c.theOther?.trim(), `${guide.skillId} vs ${c.skillId}: theOther empty`).toBeTruthy()
        expect(c.ask?.trim(), `${guide.skillId} vs ${c.skillId}: ask empty`).toBeTruthy()
      }
    }
  })

  it('keeps recognition cues illustrated, and their examples short', () => {
    // Cue examples are FRAGMENTS showing the pattern in situ — a phrase or one
    // sentence. Full questions with numbers to work belong in `examples`, where
    // the student judges them. Without a cap these drift into being second
    // worked examples, which is what made the section unwieldy in the first place.
    for (const guide of Object.values(skillBriefings)) {
      const cues = [
        ...guide.recognise,
        ...(guide.higher?.recognise ?? []),
        ...(guide.higher?.note ? [guide.higher.note] : []),
      ]
      const illustrated = cues.filter(c => c.example)
      expect(illustrated.length, `${guide.skillId} has no illustrated cues`).toBeGreaterThan(0)

      for (const c of cues) {
        expect(c.text?.trim(), `${guide.skillId}: cue with no text`).toBeTruthy()
        if (!c.example) continue
        expect(
          c.example.length,
          `${guide.skillId}: cue example too long to be a fragment — "${c.example.slice(0, 40)}…"`,
        ).toBeLessThanOrEqual(120)
      }
    }
  })

  it('keeps confusable pairings reciprocal between authored guides', () => {
    // If A tells the student it is confusable with B, then B's page must say
    // the same about A. Otherwise a student who arrives from the other
    // direction never sees the distinction, and the two pages can drift into
    // describing the same pair differently.
    //
    // Only enforced where BOTH guides exist — pointing at a skill with no guide
    // yet is normal and stays allowed.
    const namesOf = (g: (typeof skillBriefings)[string]) =>
      [...g.confusableWith, ...(g.higher?.confusableWith ?? [])].map(c => c.skillId)

    const oneWay: string[] = []
    for (const guide of Object.values(skillBriefings)) {
      for (const other of namesOf(guide)) {
        const target = skillBriefings[other]
        if (!target) continue
        if (!namesOf(target).includes(guide.skillId)) {
          oneWay.push(`${guide.skillId} -> ${other}, but ${other} does not name ${guide.skillId}`)
        }
      }
    }
    expect(oneWay, 'one-directional confusable pairings').toEqual([])
  })

  it('gives every example set at least one near-miss', () => {
    // A set where everything IS the skill only confirms what the student already
    // assumed. The near-miss is what makes it a selection drill.
    for (const guide of Object.values(skillBriefings)) {
      const foundation = guide.examples
      expect(foundation.some(e => !e.isThisSkill), `${guide.skillId} has no near-miss`).toBe(true)
      // A near-miss must say what it actually is, or the tell has nowhere to land.
      for (const e of foundation.filter(e => !e.isThisSkill)) {
        expect(e.actuallySkillId, `near-miss "${e.stem}" has no actuallySkillId`).toBeTruthy()
      }
    }
  })
})

describe('resolveBriefing', () => {
  const briefing = getBriefing('proportion')!

  it('gives Foundation the shared content only', () => {
    const g = resolveBriefing(briefing, 'foundation')
    expect(g.recognise).toEqual(briefing.recognise)
    expect(g.examples).toEqual(briefing.examples)
    expect(g.steps).toEqual(briefing.steps)
    expect(g.higherNote).toBeNull()
  })

  it('merges the Higher block on top of the shared content', () => {
    const f = resolveBriefing(briefing, 'foundation')
    const h = resolveBriefing(briefing, 'higher')

    // Merge, never replace — the Foundation method is still the method.
    expect(h.steps.slice(0, f.steps.length)).toEqual(f.steps)
    expect(h.recognise.slice(0, f.recognise.length)).toEqual(f.recognise)
    expect(h.examples.slice(0, f.examples.length)).toEqual(f.examples)

    expect(h.steps.length).toBeGreaterThan(f.steps.length)
    expect(h.examples.length).toBeGreaterThan(f.examples.length)
    expect(h.higherNote).toBeTruthy()
    expect(h.higherStepCount).toBe(h.steps.length - f.steps.length)
  })
})

describe('skill slugs', () => {
  it('round-trips every skill id through its URL slug', () => {
    for (const skillId of Object.keys(skillsById)) {
      expect(slugToSkillId(skillIdToSlug(skillId))).toBe(skillId)
    }
  })

  it('uses hyphens, not underscores, in the URL', () => {
    expect(skillIdToSlug('expanding_double_brackets')).toBe('expanding-double-brackets')
  })

  it('still resolves the underscore form, so old links land', () => {
    expect(slugToSkillId('expanding_double_brackets')).toBe('expanding_double_brackets')
  })

  it('rejects an unknown slug rather than inventing a skill', () => {
    expect(slugToSkillId('not-a-real-skill')).toBeNull()
  })
})

describe('stems stand on their own', () => {
  // Briefings cannot show a table or a part-drawn diagram unless the example
  // carries a `figure`. A stem that says "complete the tree" or "from the
  // table" is then asking for something that is not on the page: it shipped
  // once as a two-way table with no table, and once as a frequency tree with
  // no tree. Cues are exempt — a cue DESCRIBES what a paper looks like, it
  // does not ask the student to compute anything.
  // The optional word before the noun matters: the defect this was written for
  // said "complete the FREQUENCY tree", and a pattern expecting the noun
  // straight after "the" sailed past it. A guard that misses the case it was
  // written for is worse than none, so it is checked against both below.
  const forbidden =
    /\b(complete|from|shown in|in|using|read off)\s+the\s+([\w-]+\s+)?(tree|table|diagram|graph|chart|grid)\b/i

  it('never asks a student to work from something the page cannot show', () => {
    const bad: string[] = []
    for (const g of Object.values(skillBriefings)) {
      const examples = [...g.examples, ...(g.higher?.examples ?? [])]
      for (const e of examples) {
        if (e.figure) continue          // the diagram is right there
        if (forbidden.test(e.stem)) bad.push(`${g.skillId}: "${e.stem}"`)
      }
    }
    expect(bad, 'stems referring to a diagram or table that is not shown').toEqual([])
  })
})

describe('house style', () => {
  // Money was written both ways across the pages — £12,000 on one and £12000
  // on another, for the same amount, and one file used both. Thousands
  // separators everywhere.
  it('writes money over £999 with a thousands separator', () => {
    const bad: string[] = []
    const walk = (skillId: string, where: string, text?: string) => {
      if (text && /£\d{4,}/.test(text)) bad.push(`${skillId} ${where}: ${text.match(/£\d{4,}/)![0]}`)
    }
    for (const g of Object.values(skillBriefings)) {
      walk(g.skillId, 'summary', g.summary)
      for (const c of [...g.recognise, ...(g.higher?.recognise ?? []), ...(g.higher?.note ? [g.higher.note] : [])]) {
        walk(g.skillId, 'cue', c.text); walk(g.skillId, 'cue example', c.example)
        walk(g.skillId, 'figure alt', c.figure?.alt)
      }
      for (const e of [...g.examples, ...(g.higher?.examples ?? [])]) {
        walk(g.skillId, 'stem', e.stem); walk(g.skillId, 'cue', e.cue)
        walk(g.skillId, 'figure alt', e.figure?.alt)
      }
      for (const s of [...g.steps, ...(g.higher?.steps ?? [])]) {
        walk(g.skillId, 'step do', s.do); walk(g.skillId, 'step because', s.because)
        walk(g.skillId, 'step watch', s.watch)
      }
      for (const c of [...g.check, ...(g.higher?.check ?? [])]) walk(g.skillId, 'check', c)
      for (const c of [...g.confusableWith, ...(g.higher?.confusableWith ?? [])]) {
        walk(g.skillId, 'confusable', `${c.thisOne} ${c.theOther} ${c.ask}`)
      }
    }
    expect(bad, 'money written without a thousands separator').toEqual([])
  })
})

describe('worked answers', () => {
  // The page shows a student several questions, tells them which ones are the
  // skill, and used to stop there — the method steps describe what to do in the
  // abstract and nothing demonstrated it. Every stem that IS the skill carries
  // its working; a near-miss does not, because it belongs to another skill and
  // `cue` already says what it is instead.
  const yesStems = () =>
    Object.values(skillBriefings).flatMap(g =>
      [...g.examples, ...(g.higher?.examples ?? [])]
        .filter(e => e.isThisSkill)
        .map(e => ({ skillId: g.skillId, e })))

  it('works through every stem that is the skill', () => {
    const bare = yesStems()
      .filter(({ e }) => !e.worked?.length)
      .map(({ skillId, e }) => `${skillId}: "${e.stem.slice(0, 60)}…"`)
    expect(bare, 'stems that are the skill but show no working').toEqual([])
  })

  it('keeps the working to a readable number of lines', () => {
    for (const { skillId, e } of yesStems()) {
      const n = e.worked!.length
      expect(n, `${skillId}: "${e.stem.slice(0, 40)}…" has ${n} lines of working`)
        .toBeLessThanOrEqual(5)
      for (const line of e.worked!) {
        expect(line.trim(), `${skillId}: empty line of working`).toBeTruthy()
        expect(line.length, `${skillId}: working line too long — "${line.slice(0, 50)}…"`)
          .toBeLessThanOrEqual(130)
      }
    }
  })

  it('never puts working on a near-miss', () => {
    const wrong: string[] = []
    for (const g of Object.values(skillBriefings)) {
      for (const e of [...g.examples, ...(g.higher?.examples ?? [])]) {
        if (!e.isThisSkill && e.worked?.length) wrong.push(`${g.skillId}: "${e.stem.slice(0, 50)}…"`)
      }
    }
    expect(wrong, 'near-misses carrying working for another skill').toEqual([])
  })
})

describe('cue fragments are not the judged questions', () => {
  // A cue shows the PATTERN as it appears on a paper; the examples are the
  // drill. When a cue carried the whole question, the student met it captioned
  // "this is what the skill looks like" and was then asked to judge whether it
  // was the skill — the answer handed over before the question.
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.?]$/, '')

  it('never repeats a judged stem as a recognition cue', () => {
    const clashes: string[] = []
    for (const g of Object.values(skillBriefings)) {
      const stems = [...g.examples, ...(g.higher?.examples ?? [])].map(e => norm(e.stem))
      const cues = [...g.recognise, ...(g.higher?.recognise ?? []), ...(g.higher?.note ? [g.higher.note] : [])]
      for (const c of cues) {
        if (!c.example) continue
        const e = norm(c.example)
        const hit = stems.find(s => s === e || s.startsWith(e) || e.startsWith(s))
        if (hit) clashes.push(`${g.skillId}: cue "${c.example}" is also a judged stem`)
      }
    }
    expect(clashes, 'cue fragments repeated as judged stems').toEqual([])
  })
})

describe('comparison pairs', () => {
  const cards = () =>
    Object.values(skillBriefings).flatMap(g =>
      [...g.confusableWith, ...(g.higher?.confusableWith ?? [])].map(c => ({ from: g.skillId, c })))

  it('gives every comparison a worked pair of questions', () => {
    const bare = cards().filter(({ c }) => !c.pair).map(({ from, c }) => `${from} → ${c.skillId}`)
    expect(bare, 'comparisons with no example pair').toEqual([])
  })

  it('makes the two sides different questions', () => {
    for (const { from, c } of cards()) {
      expect(c.pair!.thisOne.trim(), `${from} → ${c.skillId}: empty side`).toBeTruthy()
      expect(c.pair!.theOther.trim(), `${from} → ${c.skillId}: empty side`).toBeTruthy()
      expect(c.pair!.thisOne, `${from} → ${c.skillId}: both sides identical`).not.toBe(c.pair!.theOther)
    }
  })

  it('keeps each side short enough to compare at a glance', () => {
    // The point is that the two sit side by side and differ in one visible way.
    // A paragraph on each side defeats that.
    for (const { from, c } of cards()) {
      for (const side of [c.pair!.thisOne, c.pair!.theOther]) {
        expect(side.length, `${from} → ${c.skillId}: "${side.slice(0, 40)}…" is too long to scan`)
          .toBeLessThanOrEqual(150)
      }
    }
  })

  it('shows the same pair from both sides of a mutual comparison', () => {
    // Where both skills have a page, the student meeting the pairing from
    // either direction should see the SAME two questions, swapped round. Two
    // different pairs for one distinction is how the pages drift apart.
    const wrong: string[] = []
    for (const { from, c } of cards()) {
      const other = skillBriefings[c.skillId]
      if (!other) continue
      const back = [...other.confusableWith, ...(other.higher?.confusableWith ?? [])]
        .find(x => x.skillId === from)
      if (!back?.pair) continue
      if (back.pair.thisOne !== c.pair!.theOther || back.pair.theOther !== c.pair!.thisOne) {
        wrong.push(`${from} ↔ ${c.skillId} show different pairs`)
      }
    }
    expect([...new Set(wrong)], 'mutual comparisons with mismatched pairs').toEqual([])
  })

  it('never reuses a question the same page asks the student to judge', () => {
    // The comparison cards render above the judging drill on the same stage.
    // A question that appears in both is answered before it is asked — the
    // same fault the cue fragments had.
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.?]$/, '')
    const clashes: string[] = []
    for (const g of Object.values(skillBriefings)) {
      const stems = [...g.examples, ...(g.higher?.examples ?? [])].map(e => norm(e.stem))
      for (const c of [...g.confusableWith, ...(g.higher?.confusableWith ?? [])]) {
        if (!c.pair) continue
        for (const side of [c.pair.thisOne, c.pair.theOther]) {
          const s = norm(side)
          if (stems.some(st => st === s || st.startsWith(s) || s.startsWith(st))) {
            clashes.push(`${g.skillId}: "${side.slice(0, 50)}…" is also a judged stem`)
          }
        }
      }
    }
    expect(clashes, 'comparison questions repeated in the judging drill').toEqual([])
  })
})
