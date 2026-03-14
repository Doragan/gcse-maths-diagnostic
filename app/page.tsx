"use client";

import { useState } from "react";
import { skills } from "../data/skills";
import { courses } from "../data/courses";
import { validateSkills } from "../lib/validateSkills";
import { skillsById } from "../lib/skillGraph";
import {
  createDiagnostic,
  getCurrentSkill,
  answerSkill,
} from "../lib/diagnosticEngine";
import { getPrerequisiteTree } from "../lib/skillGraph";
import type { Skill } from "../data/skills";
import { jsPDF } from "jspdf";


type ReportRow = {
  skill: string;
  topic: string;
  status: string;
};

validateSkills();

export default function Home() {
  const [started, setStarted] = useState(false);
  const course = courses.find((c) => c.id === "gcse_foundation");

  const courseSkills = skills.filter((skill) =>
    course?.skills.includes(skill.id)
  );

  const [diagnostic, setDiagnostic] = useState(
    createDiagnostic(courseSkills.map((skill) => skill.id))
  );

  const [openTopics, setOpenTopics] = useState<string[]>([]);

  const questionsAsked =
    diagnostic.testedMastered.length +
    diagnostic.testedNotMastered.length;

  function finishDiagnostic() {
    const updated = {
      ...diagnostic,
      remainingSkills: [],
    };

    setDiagnostic(updated);
  }
  
  const diagnosedSkills = new Set([
	  ...diagnostic.testedMastered,
	  ...diagnostic.inferredMastered,
	  ...diagnostic.testedNotMastered,
	  ...diagnostic.inferredNotMastered
	]).size;
	
		const mastered = new Set([
	  ...diagnostic.testedMastered,
	  ...diagnostic.inferredMastered
	]);

	const needsPractice = new Set([
	  ...diagnostic.testedNotMastered,
	  ...diagnostic.inferredNotMastered
	]);

	const untested = new Set(
	  courseSkills
		.map((s) => s.id)
		.filter((id) => !mastered.has(id) && !needsPractice.has(id))
	);
  
  const progressPercent =
  Math.round((diagnosedSkills / courseSkills.length) * 100);
  
  const totalSkills =
  mastered.size + needsPractice.size + untested.size;

const masteredCount = mastered.size;

const masteryPercent =
  totalSkills > 0
    ? Math.round((masteredCount / totalSkills) * 100)
    : 0;

  function toggleTopic(topic: string) {
    setOpenTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      }

      return [...prev, topic];
    });
  }

  const currentSkill = getCurrentSkill(diagnostic);

  function handleAnswer(knowsSkill: boolean) {
    if (!currentSkill) return;

    const updated = answerSkill(
      diagnostic,
      currentSkill.id,
      knowsSkill
    );

    setDiagnostic(updated);
  }

  function downloadReport() {
    const rows: ReportRow[] = [];

    const addRows = (ids: string[], status: string) => {
      for (const id of ids) {
        rows.push({
          skill: skillsById[id].name,
          topic: skillsById[id].topic,
          status,
        });
      }
    };

    addRows(diagnostic.testedMastered, "Mastered (Tested)");
    addRows(diagnostic.inferredMastered, "Mastered (Inferred)");
    addRows(diagnostic.testedNotMastered, "Needs Practice (Tested)");
    addRows(diagnostic.inferredNotMastered, "Needs Practice (Inferred)");

    const csv = [
      "Skill,Topic,Status",
      ...rows.map((r) => `${r.skill},${r.topic},${r.status}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "diagnostic_results.csv";
    a.click();
  }
  
  const recommendations = [...needsPractice]
  .map((id) => ({
    id,
    depth: getPrerequisiteTree(id).length,
  }))
  .sort((a, b) => a.depth - b.depth)
  .slice(0, 3)
  .map((r) => r.id);
  
  const topicSummary: Record<
  string,
  { mastered: number; needsPractice: number; untested: number }
> = {};

courseSkills.forEach((skill) => {
  const topic = skill.topic;

  if (!topicSummary[topic]) {
    topicSummary[topic] = {
      mastered: 0,
      needsPractice: 0,
      untested: 0,
    };
  }

  if (mastered.has(skill.id)) {
    topicSummary[topic].mastered++;
  } else if (needsPractice.has(skill.id)) {
    topicSummary[topic].needsPractice++;
  } else {
    topicSummary[topic].untested++;
  }
});
  
  function downloadPDF() {
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(18);
  doc.text("GCSE Maths Diagnostic Report", 20, y);

  y += 12;

  doc.setFontSize(12);
  doc.text(`Overall Mastery: ${masteryPercent}%`, 20, y);

  y += 8;
  doc.text(`${masteredCount} of ${totalSkills} skills mastered`, 20, y);

  y += 14;

  // Recommended skills
  if (recommendations.length > 0) {
    doc.setFontSize(14);
    doc.text("Suggested Skills to Practise", 20, y);

    y += 10;
    doc.setFontSize(11);

    recommendations.forEach((id) => {
      doc.text(`• ${skillsById[id].name}`, 20, y);
      y += 7;
    });

    y += 6;
  }

  // Topic summary
  doc.setFontSize(14);
  doc.text("Topic Summary", 20, y);

  y += 10;
  doc.setFontSize(11);

  Object.entries(topicSummary).forEach(([topic, data]) => {
    doc.text(
      `${topic}: ${data.mastered} mastered | ${data.needsPractice} practice | ${data.untested} untested`,
      20,
      y
    );

    y += 7;
  });

  doc.save("maths-diagnostic-report.pdf");
}
  
function getImagePath(skill: Skill) {
  return `/questions/${skill.topic}/${skill.id}.png`
}


	if (!started) {
  return (
    <main style={{ padding: "40px", maxWidth: "600px" }}>
      <h1>GCSE Maths Diagnostic</h1>

      <p>
        This diagnostic estimates your strengths and weaknesses across
        the GCSE maths curriculum.
      </p>

      <p>
        You will see example questions for each skill and indicate
        whether you know how to solve them.
      </p>

      <p>
        The diagnostic usually takes around 5–10 minutes.
      </p>

      <button
		className="secondary"
		
        onClick={() => setStarted(true)}
        style={{ marginTop: "20px" }}
      >
        Start Diagnostic
      </button>
    </main>
  );
}
  if (!currentSkill) {
    const allSkills = new Set(courseSkills.map((s) => s.id));

    const mastered = new Set([
      ...diagnostic.testedMastered,
      ...diagnostic.inferredMastered,
    ]);

    const needsPractice = new Set([
      ...diagnostic.testedNotMastered,
      ...diagnostic.inferredNotMastered,
    ]);

    const untested = new Set(
      [...allSkills].filter(
        (id) => !mastered.has(id) && !needsPractice.has(id)
      )
    );

    const recommendations = [...needsPractice]
      .map((id) => ({
        id,
        depth: getPrerequisiteTree(id).length,
      }))
      .sort((a, b) => a.depth - b.depth)
      .slice(0, 3)
      .map((r) => r.id);

    const topicSummary: Record<
      string,
      {
        mastered: number;
        needsPractice: number;
        untested: number;
        total: number;
      }
    > = {};

    const topicSkills: Record<string, string[]> = {};

    for (const id of [...mastered, ...needsPractice, ...untested]) {
      const skill = skillsById[id];
      const topic = skill.topic;

      if (!topicSummary[topic]) {
        topicSummary[topic] = {
          mastered: 0,
          needsPractice: 0,
          untested: 0,
          total: 0,
        };

        topicSkills[topic] = [];
      }

      topicSummary[topic].total++;
      topicSkills[topic].push(id);

      if (mastered.has(id)) {
        topicSummary[topic].mastered++;
      }

      if (needsPractice.has(id)) {
        topicSummary[topic].needsPractice++;
      }

      if (untested.has(id)) {
        topicSummary[topic].untested++;
      }
    }

    return (
      <main style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
        <h1>Diagnostic Complete</h1>
		<div
		  style={{
			marginTop: "10px",
			marginBottom: "25px",
			padding: "12px",
			borderRadius: "8px",
			background: "#f5f5f5",
			border: "1px solid #e0e0e0"
		  }}
		>
		  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
			Overall Mastery: {masteryPercent}%
		  </div>

		  <div style={{ fontSize: "14px", marginTop: "4px" }}>
			{masteredCount} of {totalSkills} skills mastered
		  </div>
		</div>
		
<div style={{ marginBottom: "20px" }}>

<button
  className="secondary"
  onClick={downloadReport}
  style={{ marginRight: "10px" }}
>
  Download Data (CSV)
</button>

<button
  onClick={downloadPDF}
  style={{
    background: "#1976d2",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer"
  }}
>
  Download Student Report (PDF)
</button>

</div>
		<div
		  style={{
			background: "#fff7d6",
			border: "1px solid #f2d675",
			padding: "12px",
			borderRadius: "8px",
			marginTop: "10px"
		  }}
		>
        {recommendations.length > 0 && (
          <>
            <h2 style={{ marginTop: "0px",fontSize: "18px", fontWeight: "bold" }}>We suggest working on the following skills:</h2>

            <ul style={{paddingLeft: 20 }}>
              {recommendations.map((id) => (
                <li key={id} style={{ marginBottom: "0px" }}>
                  {skillsById[id].name}
                </li>
              ))}
            </ul>
          </>
        )}
		</div>

        <h2>Topic Mastery</h2>

        {Object.entries(topicSummary).map(([topic, data]) => {
          const percent = Math.round(
            (data.mastered / data.total) * 100
          );

          const isOpen = openTopics.includes(topic);

          return (
			<div
			  key={topic}
			  style={{
				marginBottom: "16px",
				padding: "12px",
				borderRadius: "8px",
				border: "1px solid #e0e0e0",
				background: "#fafafa"
			  }}
			>
			<div
			  style={{
				cursor: "pointer",
				fontWeight: "bold",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center"
			  }}
			  onClick={() => toggleTopic(topic)}
			>
			  <span>{topic}</span>
			  <span>{isOpen ? "▼" : "▶"}</span>
			</div>

			<div
			  style={{
				fontSize: "14px",
				marginTop: "4px",
				marginBottom: "6px"
			  }}
			>
			  <span style={{ color: "#2e7d32", fontWeight: 500 }}>
				{data.mastered} mastered
			  </span>

			  <span style={{ margin: "0 6px", color: "#999" }}>•</span>

			  <span style={{ color: "#c62828", fontWeight: 500 }}>
				{data.needsPractice} needs practice
			  </span>

			  <span style={{ margin: "0 6px", color: "#999" }}>•</span>

			  <span style={{ color: "#777" }}>
				{data.untested} untested
			  </span>
			</div>


              {isOpen && (
                <ul
                  style={{
                    marginTop: "5px",
                    listStyle: "none",
                    paddingLeft: 0,
                  }}
                >
                  {(topicSkills[topic] ?? []).map((id) => {
                    const skill = skillsById[id];

                    let symbol = "•";

                    if (mastered.has(id)) {
                      symbol = "✓";
                    } else if (needsPractice.has(id)) {
                      symbol = "✗";
                    }

                    return (
					<li
					  key={id}
					  style={{
						marginBottom: "4px",
						fontSize: "14px"
					  }}
					>
                        {symbol} {skill.name}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </main>
    );
  }

return (
  <main
    style={{
      padding: "20px",
      maxWidth: "420px",
      margin: "0 auto",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}
  >
    <h1 style={{ fontSize: "24px", color:"#555", margin: 0 }}>
      GCSE Maths Diagnostic
    </h1>

    <p style={{ fontSize: "14px", margin: 0 }}>
      Question {questionsAsked + 1} | Diagnosed: {diagnosedSkills} / {courseSkills.length} | Remaining: {diagnostic.remainingSkills.length}
    </p>

    <div
      style={{
        background: "#ffffff",
        padding: "16px",
        borderRadius: "10px",
		display: "flex",
		flexDirection: "column",
        overflowY: "auto",
		maxHeight: "50vh",
		border: "2px solid #e5e5e5"
      }}
    >
      <p style={{ marginTop: 0 }}>
	  <strong>Current skill being tested:</strong>
	</p>
	      <p style={{ marginTop: 0, fontSize: "16px" }}>
	  {currentSkill.name}
	</p>

      {currentSkill.exampleQuestion && (
        <>
          <p>
            <strong>Example question:</strong>
          </p>

          <p style={{ fontSize: "16px", lineHeight: "1.4" }}>
  {currentSkill.exampleQuestion}
</p>
        </>
      )}

      {currentSkill.image && (
        <img
          src={encodeURI(`/questions/${currentSkill.topic}/${currentSkill.id}.png`)}
          alt="Example diagram"
          style={{
            maxWidth: "100%",
            maxHeight: "200px",
            margin: "10px 0",
            objectFit: "contain"
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      {currentSkill.exampleAnswer && (
        <>
          <p>
            <strong>Example answer:</strong>
          </p>

          <p style={{ fontSize: "16px", lineHeight: "1.4" }}>{currentSkill.exampleAnswer}</p>
        </>
      )}
    </div>
	
    {questionsAsked > 5 && (
      <button
        onClick={finishDiagnostic}
        style={{
          marginTop: "10px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          background: "#eee",
          cursor: "pointer"
        }}
      >
        Finish Diagnostic
      </button>
    )}
	<div style={{ flexGrow: 1 }} />
      <p style={{ margin: 0 }}>
        <strong>Do you know how to solve this type of question?</strong>
      </p>
    <div
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center"
      }}
    >
	
      <button
        onClick={() => handleAnswer(true)}
        style={{
          background: "#4CAF50",
          color: "white",
          border: "none",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
		  flex: 1
        }}
      >
        Yes, I know this
      </button>

      <button
        onClick={() => handleAnswer(false)}
        style={{
          background: "#f44336",
          color: "white",
          border: "none",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "15px",
          cursor: "pointer",
		  flex: 1
        }}
      >
        No, I need practice
      </button>
    </div>

  </main>
);
}