"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        marginBottom: "0px",
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          fontWeight: "700",
          fontSize: "18px",
          color: "#111827",
        }}
      >
        Mathsense
      </Link>
    </header>
  );
}