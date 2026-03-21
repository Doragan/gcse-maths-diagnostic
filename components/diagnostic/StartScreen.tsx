import Link from "next/link";
import { trackEvent } from "../../lib/analytics";

type Props = {
  startDiagnostic: () => void;
};

export default function StartScreen({ startDiagnostic }: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "32px",
          borderRadius: "12px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "28px" }}>Progressa</h1>

        <p style={{ lineHeight: "1.6" }}>
          This diagnostic estimates your strengths and weaknesses across the GCSE maths curriculum.
        </p>

        <p style={{ lineHeight: "1.6" }}>
          You will see example questions for each skill and indicate whether you know how to solve them.
        </p>

        <p style={{ fontWeight: "bold", marginBottom: "20px" }}>
          ⏱ Takes about 5–10 minutes
        </p>

        {/* Primary CTA */}
		<p style={{ fontSize: "12px", color: "#777", textAlign: "center" }}>
		  No signup required
		</p>
        <button
          onClick={() => {
            trackEvent("diagnostic_started");
            startDiagnostic();
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            background: "#1976d2",
            color: "white",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          Start Diagnostic
        </button>

        {/* Secondary actions */}
        <button
          onClick={() => {
            trackEvent("feedback_clicked");
            window.open(
              "https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header",
              "_blank"
            );
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #d1d5db",
  fontWeight: "600",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          Give Feedback/Get in Touch
        </button>

        <Link href="/about">
          <button
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #d1d5db",
  fontWeight: "600",
              cursor: "pointer",
            }}
          >
            About Progressa
          </button>
        </Link>
      </div>
    </main>
  );
}