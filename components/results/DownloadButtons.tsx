type Props = {
  downloadReport: () => void;
  downloadPDF: () => void;
};

export default function DownloadButtons({
  downloadReport,
  downloadPDF,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      <button
        className="secondary"
        onClick={downloadReport}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
        }}
      >
        Download Data (CSV)
      </button>

      <button
        onClick={downloadPDF}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: "#1976d2",
          color: "white",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Download Student Report (PDF)
      </button>
    </div>
  );
}