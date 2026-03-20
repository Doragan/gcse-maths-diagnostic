export default function AboutPage() {
  return (
    <main style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>About Progressa</h1>

      <p>
        Progressa is a GCSE Maths diagnostic tool designed to identify gaps
        in a student's understanding.
      </p>

      <h2>How it works</h2>
      <ol>
        <li>Answer a series of targeted questions</li>
        <li>The system identifies your strengths and weaknesses</li>
        <li>You receive a personalised revision report</li>
      </ol>

      <h2>Who it's for</h2>
      <ul>
        <li>GCSE students</li>
        <li>Teachers</li>
        <li>Parents</li>
      </ul>
    </main>
  );
}