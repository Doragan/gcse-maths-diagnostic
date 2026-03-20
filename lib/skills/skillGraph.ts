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