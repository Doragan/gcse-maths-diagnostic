import { skills } from "../../data/skills";

export function validateSkills() {

  const ids = new Set<string>();

  for (const skill of skills) {

    if (ids.has(skill.id)) {
      throw new Error(`Duplicate skill id detected: ${skill.id}`);
    }

    ids.add(skill.id);

  }

  for (const skill of skills) {

    for (const prereq of skill.prerequisites ?? []) {

      if (!ids.has(prereq)) {
        throw new Error(
          `Skill "${skill.id}" has missing prerequisite "${prereq}"`
        );
      }

    }

  }

  console.log("Skill validation passed ✓");

}