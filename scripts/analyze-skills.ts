import { skills } from '../data/skills'

const covered = new Set([
  'completing_the_square', 'compound_units', 'converting_measurements',
  'difference_of_two_squares', 'direct_proportion', 'estimating',
  'expanding_brackets', 'expanding_double_brackets', 'factorising',
  'factorising_quadratics', 'factors_and_multiples', 'finding_the_nth_term',
  'fractional_and_negative_indices', 'fractions_of_amounts', 'functions_notation',
  'growth_and_decay', 'highest_common_factor', 'indices', 'inequalities',
  'inverse_proportion', 'iteration', 'lowest_common_multiple', 'percentage_change',
  'prime_factor_decomposition', 'proportion', 'proportion_with_powers', 'ratio',
  'reverse_percentage', 'rounding', 'sequences', 'significant_figures',
  'simple_arithmetic', 'simplifying_expressions', 'simplifying_indices',
  'simultaneous_equations', 'solving_linear_equations',
  'solving_quadratic_equations_factorising', 'standard_form', 'substitution',
  'surds_simplifying', 'understanding_straight_line_graphs', 'upper_and_lower_bounds',
])

// Build adjacency: id -> Set of prerequisite ids
const prereqMap = new Map<string, Set<string>>()
const dependentMap = new Map<string, Set<string>>()

for (const s of skills) {
  if (!prereqMap.has(s.id)) prereqMap.set(s.id, new Set())
  if (!dependentMap.has(s.id)) dependentMap.set(s.id, new Set())
  for (const p of (s.prerequisites ?? [])) {
    prereqMap.get(s.id)!.add(p)
    if (!dependentMap.has(p)) dependentMap.set(p, new Set())
    dependentMap.get(p)!.add(s.id)
  }
}

function transitiveCount(id: string, map: Map<string, Set<string>>): number {
  const visited = new Set<string>()
  const queue = [id]
  while (queue.length) {
    const cur = queue.shift()!
    for (const n of (map.get(cur) ?? [])) {
      if (!visited.has(n)) { visited.add(n); queue.push(n) }
    }
  }
  return visited.size
}

const uncovered = skills.filter(s => !covered.has(s.id))

const scored = uncovered.map(s => {
  const prereqs = transitiveCount(s.id, prereqMap)
  const deps = transitiveCount(s.id, dependentMap)
  const impact = Math.min(prereqs + 1, deps + 1)
  return { ...s, prereqs, deps, impact }
}).sort((a, b) => b.impact - a.impact)

// Group by topic
const topics: Record<string, typeof scored> = {}
for (const s of scored) {
  if (!topics[s.topic]) topics[s.topic] = []
  topics[s.topic].push(s)
}

console.log('\n=== UNCOVERED SKILLS BY IMPACT SCORE ===\n')
console.log(`Total uncovered: ${uncovered.length} / ${skills.length}\n`)

// Print overall top 20
console.log('--- TOP 20 OVERALL (by impact score) ---')
for (const s of scored.slice(0, 20)) {
  const img = (s as any).image ? ' [IMAGE]' : ''
  console.log(`  [${s.impact.toString().padStart(2)}] ${s.name.padEnd(45)} (${s.topic})${img}`)
}

console.log('\n--- BY TOPIC ---')
for (const [topic, skills] of Object.entries(topics)) {
  console.log(`\n${topic} (${skills.length} uncovered):`)
  for (const s of skills) {
    const img = (s as any).image ? ' [IMAGE]' : ''
    console.log(`  [${s.impact.toString().padStart(2)}] ${s.name}${img}`)
  }
}

// Text-only high priority (no image flag, impact >= 3)
console.log('\n--- TEXT-ONLY, HIGH IMPACT (impact ≥ 3) ---')
const textOnly = scored.filter(s => !(s as any).image && s.impact >= 3)
for (const s of textOnly) {
  console.log(`  [${s.impact.toString().padStart(2)}] ${s.name.padEnd(45)} (${s.topic})`)
}
