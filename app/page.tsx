"use client";

import { useState } from "react";
import { skills } from "../data/skills";
import { courses } from "../data/courses";
import { validateSkills } from "../lib/validateSkills";
import { selectNextSkill } from "../lib/skillGraph";
import { skillsById } from "../lib/skillGraph";
import { getPrerequisiteTree } from "../lib/skillGraph";
import { getDependentTree } from "../lib/skillGraph";

validateSkills();

export default function Home() {

  const course = courses.find(c => c.id === "gcse_foundation");

  const courseSkills = skills.filter(skill =>
    course?.skills.includes(skill.id)
  );

	const [remainingSkills, setRemainingSkills] = useState(
	  courseSkills.map(skill => skill.id)
	);
const [testedMastered, setTestedMastered] = useState<string[]>([]);
const [testedNotMastered, setTestedNotMastered] = useState<string[]>([]);
const [inferredMastered, setInferredMastered] = useState<string[]>([]);
const [inferredNotMastered, setInferredNotMastered] = useState<string[]>([]);
const [prereqQueue, setPrereqQueue] = useState<string[]>([]);
const queuedSkill = prereqQueue.find(id => remainingSkills.includes(id));
const currentSkillId = queuedSkill ?? selectNextSkill(remainingSkills);
const currentSkill = currentSkillId ? skillsById[currentSkillId] : null;

function removeFromAllStates(ids: string[]) {
  setTestedMastered(prev => prev.filter(id => !ids.includes(id)));
  setTestedNotMastered(prev => prev.filter(id => !ids.includes(id)));
  setInferredMastered(prev => prev.filter(id => !ids.includes(id)));
  setInferredNotMastered(prev => prev.filter(id => !ids.includes(id)));
}

function handleAnswer(knowsSkill: boolean) {

  if (!currentSkillId) return;

  const prereqs = getPrerequisiteTree(currentSkillId);
  const dependents = getDependentTree(currentSkillId);

	if (knowsSkill) {

	  const remove = new Set([
		currentSkillId,
		...prereqs
	  ]);

	  setRemainingSkills(
		remainingSkills.filter(id => !remove.has(id))
	  );

	  removeFromAllStates([currentSkillId, ...prereqs]);

	  setTestedMastered(prev =>
		[...new Set([...prev, currentSkillId])]
	  );

	  setInferredMastered(prev =>
		[...new Set([...prev, ...prereqs])]
	  );
	  setPrereqQueue(prev =>
  prev.filter(id => id !== currentSkillId)
);

	} else {

  const remove = new Set([
    currentSkillId,
    ...dependents
  ]);

  setRemainingSkills(
    remainingSkills.filter(id => !remove.has(id))
  );

  removeFromAllStates([currentSkillId, ...dependents]);

  setTestedNotMastered(prev =>
    [...new Set([...prev, currentSkillId])]
  );

  setInferredNotMastered(prev =>
    [...new Set([...prev, ...dependents])]
  );
  
  setPrereqQueue(prev =>
  [...new Set([...prereqs, ...prev])]
);
setPrereqQueue(prev =>
  prev.filter(id => id !== currentSkillId)
);	

}

}

if (!currentSkill) {
	const topicSummary: Record<string, { mastered: number; total: number }> = {};

	const mastered = new Set([
	  ...testedMastered,
	  ...inferredMastered
	]);

	const notMastered = new Set([
	  ...testedNotMastered,
	  ...inferredNotMastered
	]);

	for (const id of [...mastered, ...notMastered]) {

	  const skill = skillsById[id];
	  const topic = skill.topic;

	  if (!topicSummary[topic]) {
		topicSummary[topic] = { mastered: 0, total: 0 };
	  }

	  topicSummary[topic].total++;

	  if (mastered.has(id)) {
		topicSummary[topic].mastered++;
	  }

	}
	type ReportRow = {
	  skill: string;
	  topic: string;
	  status: string;
	};
	function downloadReport() {

  const rows: ReportRow[] = [];

  const addRows = (ids: string[], status: string) => {
    for (const id of ids) {
      rows.push({
        skill: skillsById[id].name,
        topic: skillsById[id].topic,
        status
      });
    }
  };

  addRows(testedMastered, "Mastered (Tested)");
  addRows(inferredMastered, "Mastered (Inferred)");
  addRows(testedNotMastered, "Needs Practice (Tested)");
  addRows(inferredNotMastered, "Needs Practice (Inferred)");

  const csv = [
    "Skill,Topic,Status",
    ...rows.map(r => `${r.skill},${r.topic},${r.status}`)
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "diagnostic_results.csv";
  a.click();

}
  return (
    <main style={{ padding: "40px" }}>
      <h1>Diagnostic Complete</h1>
	  
		<button onClick={downloadReport}>
		  Download Results (CSV)
		</button>
	
      <h2>Mastered (Tested)</h2>
      <ul>
        {testedMastered.map(id => (
          <li key={id}>{skillsById[id].name}</li>
        ))}
      </ul>

      <h2>Needs Practice (Tested)</h2>
      <ul>
        {testedNotMastered.map(id => (
          <li key={id}>{skillsById[id].name}</li>
        ))}
      </ul>

      <h2>Mastered (Inferred)</h2>
      <ul>
        {inferredMastered.map(id => (
          <li key={id}>{skillsById[id].name}</li>
        ))}
      </ul>

      <h2>Needs Practice (Inferred)</h2>
      <ul>
        {inferredNotMastered.map(id => (
          <li key={id}>{skillsById[id].name}</li>
        ))}
      </ul>
	  <h2>Topic Mastery</h2>

	<ul>
	  {Object.entries(topicSummary).map(([topic, data]) => {

		const percent = Math.round(
		  (data.mastered / data.total) * 100
		);

		return (
		  <li key={topic}>
			{topic}: {data.mastered}/{data.total} ({percent}%)
		  </li>
		);

	  })}
	</ul>

    </main>
  );
}

return (
  <main style={{ padding: "40px" }}>
    <h1>GCSE Maths Diagnostic</h1>

    <p>Remaining skills to infer: {remainingSkills.length}</p>

    <h2>{currentSkill.name}</h2>

    <p>{currentSkill.exampleQuestion}</p>

    <p>
      <strong>Example answer:</strong> {currentSkill.exampleAnswer}
    </p>

      <button onClick={() => handleAnswer(true)}>
        Yes, I know this
      </button>

      <button onClick={() => handleAnswer(false)} style={{ marginLeft: "10px" }}>
        No, I need practice
      </button>

    </main>
  );
}