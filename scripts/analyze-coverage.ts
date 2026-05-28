import { skills } from '../data/skills'

const questions = [
  { skill_ids: ["direct_proportion"] },
  { skill_ids: ["percentage_change"] },
  { skill_ids: ["percentage_change"] },
  { skill_ids: ["indices"] },
  { skill_ids: ["simple_arithmetic"] },
  { skill_ids: ["upper_and_lower_bounds"] },
  { skill_ids: ["converting_measurements"] },
  { skill_ids: ["standard_form"] },
  { skill_ids: ["rounding"] },
  { skill_ids: ["standard_form"] },
  { skill_ids: ["ratio"] },
  { skill_ids: ["expanding_double_brackets"] },
  { skill_ids: ["expanding_double_brackets"] },
  { skill_ids: ["substitution"] },
  { skill_ids: ["substitution", "indices"] },
  { skill_ids: ["solving_linear_equations"] },
  { skill_ids: ["expanding_brackets"] },
  { skill_ids: ["ratio"] },
  { skill_ids: ["compound_units"] },
  { skill_ids: ["understanding_straight_line_graphs"] },
  { skill_ids: ["difference_of_two_squares"] },
  { skill_ids: ["sequences"] },
  { skill_ids: ["understanding_straight_line_graphs"] },
  { skill_ids: ["understanding_straight_line_graphs"] },
  { skill_ids: ["simultaneous_equations"] },
  { skill_ids: ["proportion"] },
  { skill_ids: ["proportion"] },
  { skill_ids: ["inequalities"] },
  { skill_ids: ["functions_notation"] },
  { skill_ids: ["iteration"] },
  { skill_ids: ["simplifying_expressions"] },
  { skill_ids: ["fractions_of_amounts"] },
  { skill_ids: ["surds_simplifying", "difference_of_two_squares"] },
  { skill_ids: ["fractional_and_negative_indices"] },
  { skill_ids: ["fractional_and_negative_indices"] },
  { skill_ids: ["fractional_and_negative_indices"] },
  { skill_ids: ["factorising_quadratics"] },
  { skill_ids: ["prime_factor_decomposition"] },
  { skill_ids: ["surds_simplifying"] },
  { skill_ids: ["highest_common_factor"] },
  { skill_ids: ["significant_figures"] },
  { skill_ids: ["reverse_percentage"] },
  { skill_ids: ["simplifying_indices"] },
  { skill_ids: ["estimating"] },
  { skill_ids: ["finding_the_nth_term"] },
  { skill_ids: ["solving_quadratic_equations_factorising"] },
  { skill_ids: ["lowest_common_multiple"] },
  { skill_ids: ["factors_and_multiples"] },
  { skill_ids: ["solving_quadratic_equations_factorising"] },
  { skill_ids: ["solving_linear_equations"] },
  { skill_ids: ["factorising"] },
  { skill_ids: ["completing_the_square"] },
  { skill_ids: ["compound_units"] },
  { skill_ids: ["compound_units"] },
  { skill_ids: ["inverse_proportion"] },
  { skill_ids: ["growth_and_decay"] },
  { skill_ids: ["proportion_with_powers"] },
  { skill_ids: ["growth_and_decay"] },
]

const skillMap = new Map(skills.map(s => [s.id, s]))

// Count questions per skill and per topic
const skillCounts = new Map<string, number>()
const topicQuestions = new Map<string, Set<string>>() // topic -> skill ids with questions

for (const q of questions) {
  for (const sid of q.skill_ids) {
    skillCounts.set(sid, (skillCounts.get(sid) ?? 0) + 1)
    const skill = skillMap.get(sid)
    if (skill) {
      if (!topicQuestions.has(skill.topic)) topicQuestions.set(skill.topic, new Set())
      topicQuestions.get(skill.topic)!.add(sid)
    }
  }
}

const allTopics = [...new Set(skills.map(s => s.topic))]

console.log('\n=== CURRENT QUESTION COVERAGE BY TOPIC ===\n')
for (const topic of allTopics) {
  const topicSkills = skills.filter(s => s.topic === topic)
  const covered = topicQuestions.get(topic) ?? new Set()
  const qCount = questions.filter(q => q.skill_ids.some(sid => skillMap.get(sid)?.topic === topic)).length
  console.log(`${topic}`)
  console.log(`  Skills with questions: ${covered.size} / ${topicSkills.length}`)
  console.log(`  Total questions: ${qCount}`)
  const coveredList = [...covered].map(id => `    • ${skillMap.get(id)?.name} (${skillCounts.get(id)} q)`)
  coveredList.forEach(l => console.log(l))
  console.log()
}

console.log('=== TOPICS WITH NO QUESTIONS (diagnostic blind spots) ===')
for (const topic of allTopics) {
  if (!topicQuestions.has(topic) || topicQuestions.get(topic)!.size === 0) {
    console.log(`  ❌ ${topic}`)
  }
}

console.log('\n=== SKILLS PER TOPIC BREAKDOWN ===')
for (const topic of allTopics) {
  const topicSkills = skills.filter(s => s.topic === topic)
  const covered = topicQuestions.get(topic) ?? new Set()
  console.log(`${topic}: ${covered.size}/${topicSkills.length} skills covered`)
}
