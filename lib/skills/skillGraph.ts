import { skills } from "../../data/skills";

export const skillsById = Object.fromEntries(
  skills.map(skill => [skill.id, skill])
);

/*
Find all prerequisite skills recursively
*/
export function getPrerequisiteTree(skillId: string): string[] {

  const visited = new Set<string>();

  function visit(id: string) {

    const skill = skillsById[id];
    if (!skill) return;

    for (const prereq of skill.prerequisites ?? []) {

      if (!visited.has(prereq)) {
        visited.add(prereq);
        visit(prereq);
      }

    }

  }

  visit(skillId);

  return Array.from(visited);

}

/**
 * The prerequisite tree as seen FROM WITHIN a course.
 *
 * `data/skills.ts` holds one global graph, and its edges encode the order GCSE
 * teaches things rather than a mathematical dependency. That is fine while GCSE
 * is the only qualification and stops being fine the moment there is a second
 * one: iGCSE (4MA1) does not examine `function_machines` at all, but the global
 * graph makes it the sole prerequisite of `substitution`, so dropping it would
 * make most of algebra permanently unreachable to an iGCSE student. The same
 * goes for `sampling` under the whole data tree, and `vectors` under
 * `translations`.
 *
 * A prerequisite that is not in the course is not a prerequisite OF that
 * course. This filters the tree to the pool and hands the result to the same
 * `getAccessibleSkillIds` / `studentMastery` seam that already takes the
 * unscoped version.
 *
 * NOTE it filters the TRANSITIVE closure rather than cutting the edge. Given
 * C → B → A with B outside the course and A inside, C still requires A: A is
 * genuinely upstream and genuinely taught, and only the untaught stepping stone
 * is skipped. Cutting the edge at B would silently drop A too.
 *
 * It exists so that a course need not carry a topic it does not teach merely to
 * keep the graph walkable, and so a future A-level or Further Maths course does
 * not have to drag GCSE scaffolding along with it.
 *
 * WAS "inert for all four of today's courses". That was true when written and
 * is now FALSE — the iGCSE pools have since had their absent-and-gating skills
 * properly excluded. Measured 2026-10-29: the scoped tree differs from the
 * unscoped one for 6 igcse_foundation skills (dropping `vectors`, `sampling`,
 * `frequency_trees`) and 10 igcse_higher skills (dropping `sampling`,
 * `frequency_trees`, `frequency_diagrams`, `box_plots`, `exact_trig_values`).
 * Still inert for both GCSE courses, which remain closed under the graph.
 *
 * So WHICH tree a caller passes now changes the answer, and only ONE caller
 * passes this one: app/practice/page.tsx. /skills, /student/dashboard,
 * components/exam/ExamReview.tsx and lib/skills/progressSeries.ts all still
 * pass the unscoped `getPrerequisiteTree`. Today's effect is mild — on those
 * surfaces prerequisite credit flows to skills outside the pool, which they do
 * not display — but it is an inconsistency, not a decision, and it is left
 * visible here rather than quietly fixed in a PR about the mini-exam.
 */
export function prerequisiteTreeWithin(
  poolIds: Iterable<string>,
): (skillId: string) => string[] {
  const pool = new Set(poolIds);
  return (skillId: string) =>
    getPrerequisiteTree(skillId).filter(id => pool.has(id));
}

/*
Find all dependent skills recursively
*/
export function getDependentTree(skillId: string): string[] {

  const dependents = new Set<string>();

  function visit(id: string) {

    for (const skill of skills) {

      if (skill.prerequisites.includes(id)) {

        if (!dependents.has(skill.id)) {

          dependents.add(skill.id);
          visit(skill.id);

        }

      }

    }

  }

  visit(skillId);

  return Array.from(dependents);

}

/*
Impact score is balanced
*/
function computeImpact(skillId: string, remainingSkills: string[]) {

  const remaining = new Set(remainingSkills);

  const prereqs = getPrerequisiteTree(skillId)
    .filter(id => remaining.has(id));

  const dependents = getDependentTree(skillId)
    .filter(id => remaining.has(id));

  const yesGain = prereqs.length + 1;
  const noGain = dependents.length + 1;

  return Math.min(yesGain, noGain);

}

/*
Greedy selection of next skill
*/
export function selectNextSkill(remainingSkills: string[]) {

  let bestSkill = remainingSkills[0];
  let bestScore = -1;

  for (const skillId of remainingSkills) {

    const score = computeImpact(skillId, remainingSkills);

    if (score > bestScore) {
      bestScore = score;
      bestSkill = skillId;
    }

  }

  return bestSkill;

}