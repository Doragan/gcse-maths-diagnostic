"use client";

import { useState } from "react";
import { trackEvent } from "../../lib/analytics";

type Props = {
  text: string;
};

export default function ShareButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackEvent("results_copied");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "6px",
        background: "#1976d2",
        color: "white",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "10px",
      }}
    >
      {copied ? "✅ Copied!" : "📋 Copy Results"}
    </button>
  );
}