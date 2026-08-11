import { describe, it, expect } from 'vitest'
import { PAPERS, DEFAULT_PAPER_ID } from './index'

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

  it('every retrySet entry keys a real, non-visual question', () => {
    const byId = new Map(paper.questions.map(q => [q.id, q]))
    for (const id of Object.keys(paper.retrySet)) {
      const q = byId.get(id)
      expect(q, `retrySet has an entry for unknown question "${id}"`).toBeDefined()
      expect(q!.visual, `${id} is visual:true but has a retrySet entry`).toBe(false)
    }
  })

  it('every non-visual question has a retrySet entry', () => {
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
