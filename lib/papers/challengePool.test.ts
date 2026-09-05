import { describe, it, expect } from 'vitest'
import { PAPERS } from '../demoPapers/index'
import { allPooledChallenges, challengesFor, tierOf, CHALLENGES_PER_TOPIC } from './challengePool'
import { buildStudentEvidence } from './feedbackEvidence'
import { toWwwEbi, answerKeyFor } from './wwwEbi'

const papers = Object.values(PAPERS)
const generated = papers.filter(p => !p.challengeQuestions.length)
const handAuthored = papers.filter(p => p.challengeQuestions.length)

describe('the pool itself', () => {
  it('covers every topic on every tier', () => {
    const keys = new Set(allPooledChallenges().map(c => c.key))
    for (const topic of ['number', 'algebra', 'ratio', 'shape', 'probdata']) {
      for (const tier of ['F', 'H']) expect(keys).toContain(`${topic}|${tier}`)
    }
  })

  it('gives every topic enough entries that papers can differ', () => {
    const byKey = new Map<string, number>()
    for (const { key } of allPooledChallenges()) byKey.set(key, (byKey.get(key) ?? 0) + 1)
    for (const [key, n] of byKey) expect(n, key).toBeGreaterThan(CHALLENGES_PER_TOPIC)
  })

  it('carries an answer for every question', () => {
    // The ONLY check available on these. They have no parameters, no
    // answer_template and no grader, so verify-question and audit-bank cannot
    // see them at all — an answer written alongside is what makes the question
    // checkable by a human or a second pass.
    for (const { key, entry } of allPooledChallenges()) {
      expect(entry.question.trim(), key).not.toBe('')
      expect(entry.answer.trim(), `${key}: ${entry.question}`).not.toBe('')
      expect(entry.skill.trim(), key).not.toBe('')
    }
  })

  it('never asks the student to read something they cannot see', () => {
    // A challenge is one line of text on a feedback sheet. There is no diagram,
    // so a question referring to one is unanswerable — this is the failure mode
    // that matters here, and it is the one a reader would not spot in review.
    const refersToSomethingAbsent =
      /\bthe (diagram|graph|chart|grid|figure)\b|\bshown (below|above)\b|\b(table|graph|diagram) below\b/i
    for (const { key, entry } of allPooledChallenges()) {
      expect(refersToSomethingAbsent.test(entry.question), `${key}: ${entry.question}`).toBe(false)
    }
  })
})

describe('choosing a paper\'s challenges', () => {
  it('lets a paper overrule the pool with its own', () => {
    for (const p of handAuthored) expect(challengesFor(p)).toEqual(p.challengeQuestions)
  })

  it('gives every generated paper a full set', () => {
    expect(generated.length).toBeGreaterThan(30)
    for (const p of generated) {
      const got = challengesFor(p)
      expect(got.length, p.id).toBe(p.topics.length * CHALLENGES_PER_TOPIC)
      for (const c of got) expect(p.topics.map(t => t.id)).toContain(c.topic)
    }
  })

  it('reads the tier from the paper, not from its id', () => {
    // OCR encodes tier in the paper NUMBER, so an id regex would need a
    // per-board special case; the subtitle says it outright on all 42.
    expect(tierOf(PAPERS['ocr-j560-01-jun25'])).toBe('F')
    expect(tierOf(PAPERS['ocr-j560-04-jun25'])).toBe('H')
    expect(tierOf(PAPERS['aqa-8300-1f-jun23'])).toBe('F')
    expect(tierOf(PAPERS['edexcel-1ma1-1h-jun25'])).toBe('H')
  })

  it('gives a Higher paper Higher questions', () => {
    const higher = new Set(allPooledChallenges().filter(c => c.key.endsWith('|H')).map(c => c.entry.question))
    for (const c of challengesFor(PAPERS['aqa-8300-1h-jun23'])) expect(higher).toContain(c.question)
  })

  it('is deterministic, so regenerating a sheet changes nothing', () => {
    // The same reason the feedback wording is hashed: a teacher who fixes one
    // mark and regenerates must not hand out a different set of questions.
    for (const p of generated) expect(challengesFor(p)).toEqual(challengesFor(p))
  })

  it('does not give every paper the same questions', () => {
    const sets = generated.map(p => challengesFor(p).map(c => c.question).join('|'))
    expect(new Set(sets).size).toBeGreaterThan(1)
  })
})

describe('answers stay with the teacher', () => {
  const paper = PAPERS['aqa-8300-1f-jun23']

  /** Full marks everywhere — every topic is strong, so challenges are offered. */
  const perfect = Object.fromEntries(paper.questions.map(q => [q.id, q.marks]))

  it('offers challenges on a strong paper', () => {
    const sheet = toWwwEbi(buildStudentEvidence(paper, perfect, 'Ama'))
    expect(sheet.challenge.length).toBeGreaterThan(0)
  })

  it('never puts the answer on the student\'s sheet', () => {
    // Structural in the type, but worth a test: this is the one mistake that
    // would be invisible in review and obvious to a student holding the paper.
    const evidence = buildStudentEvidence(paper, perfect, 'Ama')
    const sheet = toWwwEbi(evidence)
    const printed = JSON.stringify(sheet)
    for (const c of evidence.challenges) {
      expect(Object.keys(c)).toContain('answer')
      expect(printed).not.toContain(c.answer)
    }
  })

  it('keys only what was actually printed', () => {
    // The evidence offers a challenge for EVERY strong topic — often ten — and
    // the sheet then prints at most MAX_CHALLENGE. Building the key from the
    // evidence gave a teacher answers to eight questions no student received.
    const evidences = ['Ama', 'Bo'].map(n => buildStudentEvidence(paper, perfect, n))
    const printed = new Set(
      evidences.flatMap(e => toWwwEbi(e)).flatMap(s => [...s.practice, ...s.challenge].map(q => q.question)),
    )
    const key = answerKeyFor(evidences)
    expect(key.length).toBeGreaterThan(0)
    for (const e of key) expect(printed, e.question).toContain(e.question)
    expect(key.length).toBeLessThanOrEqual(printed.size)
  })

  it('collects an answer key for the class', () => {
    const evidences = ['Ama', 'Bo'].map(n => buildStudentEvidence(paper, perfect, n))
    const key = answerKeyFor(evidences)
    expect(key.length).toBeGreaterThan(0)
    for (const e of key) expect(e.answer.trim()).not.toBe('')
  })

  it('lists a question once however many students were offered it', () => {
    // Two students with identical marks get identical challenges; a teacher
    // wants one line, not one per child.
    const one = answerKeyFor([buildStudentEvidence(paper, perfect, 'Ama')])
    const two = answerKeyFor(['Ama', 'Bo'].map(n => buildStudentEvidence(paper, perfect, n)))
    expect(two).toEqual(one)
    expect(new Set(two.map(e => e.question)).size).toBe(two.length)
  })

  it('leaves out anything with no answer rather than printing a blank', () => {
    // The three hand-authored papers' retry sets predate answers, so their
    // practice questions have none — they must be absent, not empty.
    const handAuthoredPaper = handAuthored[0]
    const zero = Object.fromEntries(handAuthoredPaper.questions.map(q => [q.id, 0]))
    const evidence = buildStudentEvidence(handAuthoredPaper, zero, 'Ama')
    expect(evidence.practice.length).toBeGreaterThan(0)
    expect(evidence.practice.every(p => !p.answer)).toBe(true)
    expect(answerKeyFor([evidence])).toEqual([])
  })
})
