"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "../lib/analytics";
import { readConsent, writeConsent, loadGA, shouldShowBanner } from "../lib/cookieConsent";

// The consent question, asked once. The stored choice, the GA loader and the
// withdrawal path all live in lib/cookieConsent.ts, shared with the settings
// control on /privacy — so there is one definition of what consent means and
// one place that can turn Google Analytics on or off.
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const state = readConsent();
    if (state === "accepted") loadGA();
    setShow(shouldShowBanner(state));
    setLoaded(true);
  }, []);

  const acceptCookies = () => {
    writeConsent("accepted");
    setShow(false);
    loadGA(); // ✅ load GA AFTER consent
    // Record the decision in our own (consent-independent) store so we can
    // measure the true accept rate — i.e. how much of our traffic GA is blind to.
    // Fired after loadGA so this very event also reaches GA on accept.
    trackEvent("cookie_consent", { decision: "accept" });
  };

  const declineCookies = () => {
    // PERSISTED, unlike the original, which set React state and wrote nothing —
    // so the banner came back on the next page load while "accept" was
    // remembered forever. Asking again until the answer changes is a nudge, and
    // most of the people being asked here are 13 to 16.
    writeConsent("declined");
    setShow(false);
    // GA never loads, so this only lands in Supabase — which is exactly the point:
    // it lets us count declines that GA can't see.
    trackEvent("cookie_consent", { decision: "decline" });
  };

  if (!loaded || !show) return null;

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
    {/* Named Google, because consent has to be informed to be consent, and
        "we use analytics" does not tell a fourteen-year-old who receives it.
        Declining is stated as costing nothing, so the choice is a real one. */}
    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
      📊 We use Google Analytics to see how <strong>Mathsense</strong> is used.
      Declining changes nothing about the site. You can change your mind any time
      on our <a href="/privacy" style={{ color: "#1976d2" }}>privacy page</a>.
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