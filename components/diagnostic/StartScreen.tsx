import Link from "next/link";
import { trackEvent } from "../../lib/analytics";

type Props = {
  startDiagnostic: () => void;
};

export default function StartScreen({ startDiagnostic }: Props) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "#f5f5f5",
        padding: "20px",
		boxSizing: "border-box",
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
        <h1 style={{ marginTop: 0,marginBottom: 0, fontSize: "28px" }}>Mathsense</h1>
		<h2 style={{ marginTop: 0}}>Know what to learn next.</h2>

        <p style={{ lineHeight: "1.6" }}>
          Identify your strengths and weaknesses across GCSE Maths — and get a clear path to improve.
        </p>

        <p style={{ fontWeight: "bold", marginBottom: "20px" }}>
          ⏱ Takes about 5–10 minutes
        </p>

        {/* Primary CTA */}
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
            marginBottom: "8px",
          }}
        >
          Start Your Diagnostic
        </button>

        {/* Secondary actions */}
		  <Link href="/about" style={{ textDecoration: "none" }}>
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
      marginBottom: "8px",
    }}
  >
    Learn more about Mathsense
  </button>
</Link>
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
          }}
        >
          Give Feedback/Get in Touch
        </button>

      </div>
    </main>
  );
}