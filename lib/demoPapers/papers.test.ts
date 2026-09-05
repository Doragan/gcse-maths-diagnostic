import { describe, it, expect } from 'vitest'
import { PAPERS, DEFAULT_PAPER_ID } from './index'
import { skills } from '../../data/skills'

// Characterisation tests, run against EVERY registered paper — the marking
// page used to hardcode these invariants implicitly for the one paper it had;
// now that a paper is data, a broken one (a question referencing a topic that
// doesn't exist, a sample student with no marks) would silently render wrong
// instead of failing to compile. Generic over the registry rather than
// per-paper so a newly added paper is covered automatically — see
// lib/demoPapers/types.ts for the "adding a paper" contract this enforces.

describe('demoPapers registry', () => {
  it('has at least one paper, and the default id resolves', () => {
    expect(Object.keys(PAPERS).length).toBeGreaterThan(0)
    expect(PAPERS[DEFAULT_PAPER_ID]).toBeDefined()
  })

  it('every paper is registered under its own id', () => {
    for (const [key, paper] of Object.entries(PAPERS)) {
      expect(paper.id).toBe(key)
    }
  })
})

describe.each(Object.values(PAPERS))('$id', (paper) => {
  it('has at least one topic and one question', () => {
    expect(paper.topics.length).toBeGreaterThan(0)
    expect(paper.questions.length).toBeGreaterThan(0)
  })

  it('every question points at a real topic', () => {
    const topicIds = new Set(paper.topics.map(t => t.id))
    for (const q of paper.questions) {
      expect(topicIds.has(q.topic), `${q.id} -> topic "${q.topic}"`).toBe(true)
    }
  })

  it('question ids are unique', () => {
    const ids = paper.questions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // skillIds is what makes an item trackable — a typo here would silently
  // credit a skill that doesn't exist, so check against the real skill graph
  // rather than trusting the shape.
  it('every skillId is a real skill in data/skills.ts', () => {
    const known = new Set(skills.map(s => s.id))
    for (const q of paper.questions) {
      for (const id of q.skillIds) {
        expect(known.has(id), `${q.id} -> unknown skill "${id}"`).toBe(true)
      }
    }
  })

  // A question with NO skill tag is allowed, because the taxonomy has real
  // holes — no outlier-identification node, no 2D counterpart to
  // properties_of_3d_solids — and the honest response is to leave such a
  // question untagged rather than credit the nearest skill. A student would
  // otherwise be recorded as having demonstrated something they never showed,
  // and a false positive in the skill map is worse than a gap in it. The marks
  // still count towards the score and the topic.
  //
  // THE CAP WAS RAISED FROM 1 TO 3 (2026-09-04) BECAUSE 1 CAUSED A MIS-TAG.
  // OCR J560/02 q4 has two items in the properties-of-2D-shapes gap, and the
  // session coding it tagged the second to angles_on_lines_and_circles with the
  // note "this paper's untagged budget is one" — exactly the pressure this cap
  // was meant to prevent, applied by the cap itself. A limit that forces the
  // failure it guards against is set wrong.
  //
  // Three still catches the regression that matters: a generator that stops
  // reading skill_ids would untag thirty or forty items on a paper, not three.
  // If a paper ever needs a fourth, that is a signal to add the missing skill
  // rather than to raise this again.
  it('has at most three untagged questions, and tags the rest', () => {
    const untagged = paper.questions.filter(q => q.skillIds.length === 0)
    expect(untagged.length, `untagged: ${untagged.map(q => q.id).join(', ')}`).toBeLessThanOrEqual(3)
  })

  // NB there is deliberately NO "multi-skill implies exam-kind" test here.
  // `defaultKindForSkills` calls that a default an author may override, and the
  // project's actual rule is narrower — exam-kind is for 2+ INDEPENDENT skills,
  // so a pair like [enlargements, fractional_enlargements] is rightly mastery.
  // The audit's tagging does not follow either rule consistently (the same
  // [proportion, simple_arithmetic] pair is mastery on 3F q3a and exam on 2F
  // q7), so asserting one here would encode an invariant the codebase does not
  // hold. It costs nothing for now: the marks writer forces attempts to
  // positive-only regardless of the item's own kind.

  it('every retrySet entry keys a real question, and a visual one carries a grid', () => {
    // A `visual` item is excluded by default because a question depending on a
    // diagram cannot be reissued as text. It CAN have a retry once that retry
    // supplies its own grid — "reflect this shape" is perfectly answerable on
    // paper when the shape is printed. So the rule is not "never visual", it is
    // "visual only with a diagram", and a bare text retry on a visual item is
    // still the defect this guards against.
    const byId = new Map(paper.questions.map(q => [q.id, q]))
    for (const [id, retry] of Object.entries(paper.retrySet)) {
      const q = byId.get(id)
      expect(q, `retrySet has an entry for unknown question "${id}"`).toBeDefined()
      if (q!.visual) {
        expect(retry.diagram, `${id} is visual:true, so its retry needs a diagram`).toBeDefined()
      }
    }
  })

  it('never asks the student to read something that is not there', () => {
    // A retry is one line of text on a feedback sheet: no diagram, ever. So a
    // question mentioning one is unanswerable, and the student cannot tell
    // whether they are missing a picture or missing the maths.
    //
    // This is not hypothetical. It caught "Work out the SHADED area between the
    // circles" sitting in a hand-authored set, where nothing was shaded because
    // nothing was drawn. With 1,324 more retries planned, it is worth a guard.
    //
    // NARROWED TWICE, each time because a broader pattern flagged a question
    // that was perfectly answerable:
    //
    //   • "the side OPPOSITE that angle" is ordinary trigonometry, not a page
    //     reference.
    //   • a bare "shaded", or "the grid", flags a question that DESCRIBES its
    //     own figure — "a grid is made of 20 squares and 7 are shaded; what
    //     percentage of the grid is shaded?" needs no picture at all.
    //
    // What is left is phrasing that only makes sense when something is printed
    // nearby. That is a deliberate trade for precision: a guard that cries
    // wolf gets loosened until it catches nothing, and this one still catches
    // the defect it was written for — "work out the shaded area between the
    // circles", with no circles drawn.
    //
    // A retry that CARRIES a diagram is exempt, and must be: referring to a
    // grid printed directly underneath is the correct way to write these.
    const absent = /\bthe shaded (area|region)\b|\bshown (below|above)\b|\b(diagram|graph|chart|grid|figure) below\b/i
    for (const [id, r] of Object.entries(paper.retrySet)) {
      if (r.diagram) continue
      expect(absent.test(r.question), `${id}: ${r.question}`).toBe(false)
    }
  })

  // ALL OR NOTHING, rather than always-all.
  //
  // A paper generated from data/exam-audit/ has no retrySet at all: retry
  // questions are written from question text and the audit transcribes none.
  // That is a documented state — the feedback sheet omits its "Practise these"
  // section rather than printing an empty heading — and it is not what this
  // test was ever guarding against.
  //
  // The real defect is PARTIAL coverage: a paper that offers practice questions
  // for some dropped marks and silently not for others, so a student is told to
  // practise question 4 and told nothing about question 11. That still fails.
  // Visual items are the exception on purpose: they are an OPTIONAL extra that
  // needs a diagram spec authored per item, so a paper is complete without
  // them and gains them one at a time.
  it('offers retry questions for every non-visual question, or for none', () => {
    if (Object.keys(paper.retrySet).length === 0) return
    for (const q of paper.questions) {
      if (!q.visual) expect(paper.retrySet[q.id], `${q.id} has no retry question`).toBeDefined()
    }
  })

  it('every challenge question points at a real topic', () => {
    const topicIds = new Set(paper.topics.map(t => t.id))
    for (const cq of paper.challengeQuestions) {
      expect(topicIds.has(cq.topic), `challenge "${cq.skill}" -> topic "${cq.topic}"`).toBe(true)
    }
  })

  it('every sample student has a mark for every question, within range', () => {
    const questionIds = paper.questions.map(q => q.id)
    for (const name of paper.sampleStudents) {
      const row = paper.sampleMarks[name]
      expect(row, `${name} has no sample marks`).toBeDefined()
      for (const q of paper.questions) {
        const v = row[q.id]
        expect(v, `${name} × ${q.id}`).toBeGreaterThanOrEqual(0)
        expect(v, `${name} × ${q.id}`).toBeLessThanOrEqual(q.marks)
      }
      expect(questionIds.every(id => id in row), `${name} has stray/missing question ids`).toBe(true)
    }
  })
})
