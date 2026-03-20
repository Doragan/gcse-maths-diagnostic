"use client";

import { useEffect, useRef } from "react";

export default function AdSlot() {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // Prevent re-initialising the same ad
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
    <div style={{ margin: "20px 0", textAlign: "center" }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}