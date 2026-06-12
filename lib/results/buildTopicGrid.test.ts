import { describe, it, expect } from 'vitest'
import { buildTopicGrid } from './buildTopicGrid'

describe('buildTopicGrid', () => {
  it('partitions each topic\'s skills into mastered / needs-practice / untested', () => {
    const grid = buildTopicGrid(
      { Number: ['a', 'b', 'c'], Algebra: ['d'] },
      new Set(['a']),
      new Set(['b']),
    )
    const number = grid.find(g => g.topic === 'Number')!
    expect(number.masteredSkills).toEqual(['a'])
    expect(number.needsPracticeSkills).toEqual(['b'])
    expect(number.untestedSkills).toEqual(['c']) // in neither set
    const algebra = grid.find(g => g.topic === 'Algebra')!
    expect(algebra.untestedSkills).toEqual(['d'])
  })
  it('mastered takes precedence if a skill appears in both sets', () => {
    const grid = buildTopicGrid({ T: ['x'] }, new Set(['x']), new Set(['x']))
    expect(grid[0].masteredSkills).toEqual(['x'])
    expect(grid[0].needsPracticeSkills).toEqual([])
  })
})
