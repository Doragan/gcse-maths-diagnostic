export function buildTopicGrid(topicSkills, mastered, needsPractice) {

  return Object.entries(topicSkills).map(([topic, skillIds]) => {

    const masteredSkills = [];
    const needsPracticeSkills = [];
    const untestedSkills = [];

    skillIds.forEach(id => {

      if (mastered.has(id)) masteredSkills.push(id);
      else if (needsPractice.has(id)) needsPracticeSkills.push(id);
      else untestedSkills.push(id);

    });

    return {
      topic,
      masteredSkills,
      needsPracticeSkills,
      untestedSkills
    };

  });

}
