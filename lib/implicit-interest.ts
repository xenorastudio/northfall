"use client";

import { addUserInterests, IMPLICIT_VISIT_THRESHOLD } from "@/lib/user-interests";

function visitKey(kind: "community" | "game", id: string) {
  return `nf-int-vis-${kind}:${id}`;
}

function appliedKey(kind: "community" | "game", id: string) {
  return `nf-int-applied-${kind}:${id}`;
}

/**
 * طريقة 2: زيارة مجتمع أو فتح كرت لعبة — بعد IMPLICIT_VISIT_THRESHOLD مرات
 * يُضاف الوسم تلقائياً لـ userInterests (مرة واحدة لكل كيان).
 */
export function trackImplicitInterest(
  kind: "community" | "game",
  id: string,
  tags: string[],
  uid: string | undefined | null
): void {
  if (!uid || !id || !tags.length) return;
  if (typeof window === "undefined") return;
  if (localStorage.getItem(appliedKey(kind, id))) return;

  const key = visitKey(kind, id);
  const count = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(count));

  if (count >= IMPLICIT_VISIT_THRESHOLD) {
    localStorage.setItem(appliedKey(kind, id), "1");
    void addUserInterests(uid, tags).catch((e) =>
      console.error("[implicit-interest]", kind, id, e)
    );
  }
}
