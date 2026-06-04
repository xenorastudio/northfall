"use client";

import { useEffect } from "react";

export default function ThreadRedirect({ id }: { id: string }) {
  useEffect(() => {
    window.location.replace(`/forum?view=thread&threadId=${id}`);
  }, [id]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Cairo, sans-serif",
        direction: "rtl",
      }}
    >
      <div style={{ textAlign: "center", color: "#6b7280" }}>
        <svg
          width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p style={{ fontSize: 14 }}>جاري فتح الموضوع...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
