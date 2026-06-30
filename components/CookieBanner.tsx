"use client";

import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID, trackEvent } from "../lib/analytics";

export default function CookieBanner() {
  const [consent, setConsent] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent");
    if (stored === "true") {
      setConsent(true);
      loadGA();
    }
    setLoaded(true);
  }, []);

  const loadGA = () => {
    // The single GA loader (after consent). send_page_view is disabled — the
    // Analytics component sends every page_view manually (initial + SPA routes),
    // so leaving auto page_view on would double-count.
    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
    `;
    document.head.appendChild(script2);
  };

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setConsent(true);
    loadGA(); // ✅ load GA AFTER consent
    // Record the decision in our own (consent-independent) store so we can
    // measure the true accept rate — i.e. how much of our traffic GA is blind to.
    // Fired after loadGA so this very event also reaches GA on accept.
    trackEvent("cookie_consent", { decision: "accept" });
  };

  const declineCookies = () => {
    // GA never loads, so this only lands in Supabase — which is exactly the point:
    // it lets us count declines that GA can't see.
    trackEvent("cookie_consent", { decision: "decline" });
    setConsent(true);
  };

  if (!loaded || consent) return null;

  return (
  <div
    style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "90%",
      maxWidth: "500px",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      padding: "16px",
      zIndex: 1000,
      border: "1px solid #e0e0e0",
    }}
  >
    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
		📊 We use analytics to improve <strong>Mathsense</strong>.
    </p>

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "12px",
      }}
    >
      <button
        onClick={acceptCookies}
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "6px",
          border: "none",
          background: "#1976d2",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Accept
      </button>

      <button
        onClick={declineCookies}
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          background: "white",
          color: "#555",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Decline
      </button>
    </div>
  </div>
);
}