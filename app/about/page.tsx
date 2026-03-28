"use client";

import Header from "@/components/Header";

export default function AboutPage() {
  return (
  <>
	  <header
	  style={{
		padding: "16px 24px",
		borderBottom: "1px solid #e5e7eb",
		marginBottom: "24px",
	  }}
	>
	  <a
		href="/"
		style={{
		  textDecoration: "none",
		  fontWeight: "700",
		  fontSize: "18px",
		  color: "#111827",
		}}
	  >
		Mathsense
	  </a>
	</header>
	
    <main
      style={{
        padding: "40px 24px",
        maxWidth: "720px",
        margin: "0 auto",
        lineHeight: "1.6",
		background: "#ffffff",
		borderRadius: "12px",
		boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>About Mathsense</h1>

      <p style={{ marginBottom: "16px" }}>
        Mathsense is built to help students and teachers understand maths more
        clearly — by identifying gaps and showing what to do next.
      </p>

      <p style={{ marginBottom: "32px" }}>
        We’re starting with a diagnostic tool that quickly highlights strengths
        and weaknesses across GCSE Maths. Even at this early stage, we believe
        it can make a real difference.
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          margin: "32px 0",
        }}
      />

      {/* Section: Where we're going */}
      <section style={{ marginBottom: "40px" }}>
        <h2
          style={{
            marginBottom: "20px",
            color: "#1f3a8a",
          }}
        >
          Where we’re going
        </h2>

        <div
          style={{
            padding: "18px",
            background: "#f9fafb",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>For Students</h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li style={{ marginBottom: "6px" }}>Personalised learning paths</li>
            <li style={{ marginBottom: "6px" }}>
              Unlimited practice questions with instant, intelligent feedback
            </li>
            <li style={{ marginBottom: "6px" }}>
              Regular skill checks to keep knowledge fresh
            </li>
            <li>Support for courses beyond GCSE Maths</li>
          </ul>
        </div>

        <div
          style={{
            padding: "18px",
            background: "#f9fafb",
            borderRadius: "10px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>For Teachers and Tutors</h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li style={{ marginBottom: "6px" }}>
              Clear insight into individual students and whole classes
            </li>
            <li style={{ marginBottom: "6px" }}>
              The ability to set targeted tasks
            </li>
            <li>
              Tools to give feedback in your school’s preferred format
            </li>
          </ul>
        </div>
      </section>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          margin: "32px 0",
        }}
      />

      {/* Section: Help shape */}
      <section>
        <h2
          style={{
            marginBottom: "20px",
            color: "#1f3a8a",
          }}
        >
          Help shape Mathsense
        </h2>

        <p style={{ marginBottom: "20px" }}>
          We’re actively building and improving Mathsense, and feedback makes a
          huge difference.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <button
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#f3f4f6",
              color: "#111827",
              border: "1px solid #d1d5db",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open("https://ko-fi.com/mathsense", "_blank")
            }
          >
            Donate to Mathsense
          </button>

          <button
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#f3f4f6",
              color: "#111827",
              border: "1px solid #d1d5db",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open(
                "https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=dialog",
                "_blank"
              )
            }
          >
            Give Feedback / Get in Touch
          </button>
        </div>
      </section>
    </main>
	</>
  );
}