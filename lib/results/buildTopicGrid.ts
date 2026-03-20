export function buildTopicGrid(
  topicSkills: Record<string, string[]>,
  mastered: Set<string>,
  needsPractice: Set<string>
) {
  return Object.entries(topicSkills).map(([topic, skillIds]) => {
    const masteredSkills: string[] = [];
    const needsPracticeSkills: string[] = [];
    const untestedSkills: string[] = [];

    skillIds.forEach((id: string) => {
      if (mastered.has(id)) masteredSkills.push(id);
      else if (needsPractice.has(id)) needsPracticeSkills.push(id);
      else untestedSkills.push(id);
    });

    return {
      topic,
      masteredSkills,
      needsPracticeSkills,
      untestedSkills,
    };
  });
}