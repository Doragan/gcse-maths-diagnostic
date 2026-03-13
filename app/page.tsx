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
  
  const diagnosedSkills =
  diagnostic.testedMastered.length +
  diagnostic.inferredMastered.length +
  diagnostic.testedNotMastered.length +
  diagnostic.inferredNotMastered.length;
  
  const progressPercent =
  Math.round((diagnosedSkills / courseSkills.length) * 100);

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
      <main style={{ padding: "40px" }}>
        <h1>Diagnostic Complete</h1>

        <button className="secondary" 
		onClick={downloadReport}
		onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
	    onMouseOut={(e) => e.currentTarget.style.opacity = "1"}>
          Download Results (CSV)
        </button>

        {recommendations.length > 0 && (
          <>
            <h2>We suggest working on the following skills:</h2>

            <ul style={{paddingLeft: 20 }}>
              {recommendations.map((id) => (
                <li key={id} style={{ marginBottom: "0px" }}>
                  {skillsById[id].name}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Topic Mastery</h2>

        {Object.entries(topicSummary).map(([topic, data]) => {
          const percent = Math.round(
            (data.mastered / data.total) * 100
          );

          const isOpen = openTopics.includes(topic);

          return (
            <div key={topic} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => toggleTopic(topic)}
              >
                {topic}: {data.mastered}/{data.total} ({percent}%)
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
                        style={{ marginBottom: "3px" }}
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
    <main style={{
    padding: "40px",
    maxWidth: "700px",
    margin: "0 auto",
    fontSize: "18px",
    lineHeight: "1.6",
	fontFamily: "system-ui"
  }}>
      <h1 style={{
		  fontSize: "32px",
		  marginTop: "25px",
		  marginBottom: "10px"
	  }}>GCSE Maths Diagnostic</h1>
	  
	  <div className="progressInfo">

		  <p>Question {questionsAsked + 1}</p>

		  <p>
			Skills diagnosed: {diagnosedSkills} / {courseSkills.length}
		  </p>

		  <p>
			Remaining skills: {diagnostic.remainingSkills.length}
		  </p>
		  <p>
			  Progress: {progressPercent}%
			</p>

	</div>

		
	  <div className="questionCard">
		  <h2   style={{
			fontSize: "24px",
			marginTop: "25px",
			marginBottom: "10px"
			}}>
			<strong>Current Skill: </strong>{currentSkill.name}
		</h2>
			{currentSkill.exampleQuestion && (
			  <>
			<p>
				<strong>Example question:</strong>
			</p>
			<p style={{ marginBottom: "20px" }}>
				{currentSkill.exampleQuestion}</p>
				</>
			)}

			<img
			  src={encodeURI(`/questions/${currentSkill.topic}/${currentSkill.id}.png`)}
			  alt="Example diagram"
			  style={{
				maxWidth: "300px",
				marginTop: "10px",
				marginBottom: "10px"
			  }}
			  onError={(e) => {
				e.currentTarget.style.display = "none";
			  }}
			/>

			{currentSkill.exampleAnswer && (
			  <>
				<p>
				  <strong>Example answer:</strong>
				</p>

				<p style={{ marginBottom: "20px" }}>
				  {currentSkill.exampleAnswer}
				</p>
			  </>
			)}

			<p>
				<strong>Do you know how to solve this type of question?</strong>
			</p>
			<div className="buttonRow" style={{ marginTop: "20px"}}>
			<button
			  className = "yes"
			  onClick={() => handleAnswer(true)}
			  onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
			  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
			>
			  Yes, I know this
			</button>

			<button
				className="no"
			  onClick={() => handleAnswer(false)}
			  onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
			  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
			>

	  No, I need practice
	</button>
			</div>	
		</div>
	  
      {questionsAsked > 5 && (
        <>
          <p style={{ marginTop: "20px" }}>
            If you want to end your diagnostic early with{" "}
            {diagnostic.remainingSkills.length} skills
            remaining, you can finish now.
          </p>

          <button className="secondary"
			  onClick={finishDiagnostic}
			  onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
			  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
			>
			  Finish Diagnostic
		</button>
        </>
      )}
    </main>
  );
}