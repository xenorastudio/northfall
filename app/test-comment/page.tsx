"use client";

import { useState } from "react";
import SimpleCommentEditor from "../components/SimpleCommentEditor";
import CommentFormatter from "../components/CommentFormatter";

export default function TestCommentPage() {
  const [comments, setComments] = useState<string[]>([]);

  const handleSubmit = (text: string) => {
    setComments([...comments, text]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1e", padding: 40, fontFamily: "Tahoma, Arial, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8e8ea", marginBottom: 20 }}>
          اختبار محرر التعليقات
        </h1>

        <div style={{ marginBottom: 30 }}>
          <SimpleCommentEditor onSubmit={handleSubmit} placeholder="اكتب تعليقك هنا..." submitLabel="نشر" />
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8ea", marginBottom: 20 }}>
            التعليقات ({comments.length})
          </h2>

          {comments.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#88889a", fontSize: 13 }}>
              لا توجد تعليقات بعد. جرب المحرر أعلاه!
            </div>
          )}

          {comments.map((comment, idx) => (
            <div
              key={idx}
              style={{
                background: "#2a2a2e",
                border: "1px solid #3a3a3e",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#4a4a4e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#b0b0b8",
                  }}
                >
                  U
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#e8e8ea" }}>مستخدم</span>
                <span style={{ fontSize: 11, color: "#88889a" }}>الآن</span>
              </div>

              <CommentFormatter text={comment} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: 20, background: "#2a2a2e", border: "1px solid #3a3a3e", borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e8e8ea", marginBottom: 12 }}>
            أمثلة على التنسيق:
          </h3>
          <div style={{ fontSize: 12, color: "#c8c8ca", lineHeight: 2 }}>
            <div>• **نص غامق** → <strong>نص غامق</strong></div>
            <div>• *نص مائل* → <em>نص مائل</em></div>
            <div>• [رابط](https://example.com) → <a href="https://example.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4a9eff", textDecoration: "underline" }}>رابط</a></div>
            <div>• `كود` → <code style={{ background: "#1a1a1e", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" }}>كود</code></div>
            <div>• - عنصر قائمة → • عنصر قائمة</div>
            <div>• 1. عنصر مرقم → 1. عنصر مرقم</div>
          </div>
        </div>
      </div>
    </div>
  );
}
