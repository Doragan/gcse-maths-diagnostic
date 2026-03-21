"use client";

import { useEffect, useRef } from "react";

export default function AdSlot() {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // Prevent duplicate initialisation
    if (adRef.current.getAttribute("data-adsbygoogle-status") === "done") {
      return;
    }

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Ad error", e);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden", // 🔥 critical for mobile overflow
        display: "flex",
        justifyContent: "center",
        margin: "20px 0",
      }}
    >
      <ins
        ref={adRef} // ✅ THIS WAS MISSING
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
        }}
        data-ad-client="ca-pub-XXXXXXXX"
        data-ad-slot="XXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}