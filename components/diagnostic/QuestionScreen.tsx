import type { Skill } from "../../data/skills";

type Props = {
  currentSkill: Skill;
  questionsAsked: number;
  diagnosedSkills: number;
  courseSkillsLength: number;
  remainingSkills: number;
  finishDiagnostic: () => void;
  handleAnswer: (knowsSkill: boolean) => void;
};

export default function QuestionScreen({
  currentSkill,
  questionsAsked,
  diagnosedSkills,
  courseSkillsLength,
  remainingSkills,
  finishDiagnostic,
  handleAnswer,
}: Props) {
	
const progressPercent = Math.round(
  (diagnosedSkills / courseSkillsLength) * 100
);

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/[^\w-]+/g, "");    // remove weird chars
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
        gap: "12px",
      }}
    >
      <h1 style={{ fontSize: "24px", color: "#555", margin: 0 }}>
        Progressa
      </h1>

      <p style={{ fontSize: "14px", margin: 0 }}>
        Question {questionsAsked + 1} | Diagnosed: {diagnosedSkills} /{" "}
        {courseSkillsLength} | Remaining: {remainingSkills}
      </p>
	  <div
  style={{
    width: "100%",
    height: "8px",
    background: "#eee",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "6px",
  }}
>
  <div
    style={{
      width: `${progressPercent}%`,
      height: "100%",
      background: "#4CAF50",
      transition: "width 0.3s ease",
    }}
  />
</div>

<p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
  {progressPercent}% complete
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
          border: "2px solid #e5e5e5",
        }}
      >
        <p style={{ marginTop: 0 }}>
          <strong>Current skill being tested:</strong>
        </p>

        <p style={{ marginTop: 0, fontSize: "16px" }}>{currentSkill.name}</p>

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
            src={`/questions/${toSlug(currentSkill.topic)}/${currentSkill.id}.png`}
            alt="Example diagram"
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              margin: "10px 0",
              objectFit: "contain",
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

            <p style={{ fontSize: "16px", lineHeight: "1.4" }}>
              {currentSkill.exampleAnswer}
            </p>
          </>
        )}
      </div>

      <div style={{ flexGrow: 1 }} />

      {questionsAsked > 5 && (
        <button
          onClick={finishDiagnostic}
          style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "#eee",
            cursor: "pointer",
          }}
        >
          Finish Diagnostic
        </button>
      )}

      <p style={{ margin: 0 }}>
        <strong>Do you know how to solve this type of question?</strong>
      </p>

      <div
        style={{
			position: "sticky",
			bottom: 0,
			display: "flex",
			gap: "10px",
			justifyContent: "center",
			padding: "12px",
			paddingBottom: "max(12px, env(safe-area-inset-bottom))",
			background: "#f4f6f8", // match your page background
			zIndex: 10,
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
            flex: 1,
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
            flex: 1,
          }}
        >
          No, I need practice
        </button>
      </div>
    </main>
  );
}