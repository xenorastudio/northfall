// ─── Ranking System: صيت (Reputation) + XP (Points) ─────────────────
//
// صيت: from votes only, with diminishing returns based on content vote count
//   - App صيت (karma): from post votes
//   - Forum صيت (forumKarma): from thread votes
// XP: from activity only — posting (+3), replying (+1), commenting (+1)
//
// voterWeight: 5-tier XP-based system (harder to reach full trust)
//   XP 0-30:    0.1  (مبتدئ — almost no influence)
//   XP 30-100:  0.25 (متمرس — weak influence)
//   XP 100-300: 0.5  (نشيط — moderate influence)
//   XP 300-700: 0.75 (متقدم — strong influence)
//   XP 700+:    1.0  (محترف+ — full trust)

export interface VoterData {
  xp: number;  // activity points — determines voter trust
}

/** Calculate voter weight based on XP (5 tiers: 0.1 → 1.0) */
export function calcVoterWeight(data: VoterData): number {
  if (data.xp < 30) return 0.1;     // مبتدئ — brand new, almost no influence
  if (data.xp < 100) return 0.25;   // متمرس — still weak
  if (data.xp < 300) return 0.5;    // نشيط — moderate
  if (data.xp < 700) return 0.75;   // متقدم — strong
  return 1.0;                        // محترف+ — full trust
}

/** Calculate صيت gain from a vote, with diminishing returns and trust-based weight */
export function calcSaitGain(contentVotes: number, voteDir: 1 | -1, voterData: VoterData): number {
  const voterWeight = calcVoterWeight(voterData);

  // Upvote: diminishing returns based on how many votes the content already has
  // First 10 votes: full impact (1.0)
  // 10-100 votes: medium impact (0.6)
  // 100+ votes: still meaningful (0.25) — viral posts keep real value
  const multiplier = contentVotes < 10 ? 1 : contentVotes < 100 ? 0.6 : 0.25;
  const raw = multiplier * voterWeight;
  // Round to 2 decimal places for clean storage, but DON'T force minimum 1
  // Low-trust voters give small sait (0.1, 0.25, etc.) — this is intentional
  // UI rounds for display, but internal value stays precise
  const rounded = Math.round(raw * 100) / 100;
  if (voteDir === -1) {
    return -rounded;
  }
  return rounded;
}

/** Get level info from XP (activity points) — determines rank */
export function getLevel(xp: number) {
  if (xp >= 100000) return { name: "اسطورة", tier: 8, color: "text-amber-300", bg: "bg-amber-300/10", border: "border-amber-300/20", glow: "shadow-amber-300/10" };
  if (xp >= 25000) return { name: "بطل", tier: 7, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", glow: "shadow-orange-400/10" };
  if (xp >= 7500) return { name: "خبير", tier: 6, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", glow: "shadow-purple-400/10" };
  if (xp >= 2500) return { name: "محترف", tier: 5, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", glow: "shadow-blue-400/10" };
  if (xp >= 750) return { name: "متقدم", tier: 4, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", glow: "shadow-cyan-400/10" };
  if (xp >= 200) return { name: "نشيط", tier: 3, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", glow: "shadow-green-400/10" };
  if (xp >= 50) return { name: "متمرس", tier: 2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "" };
  return { name: "مبتدئ", tier: 1, color: "text-nf-dim", bg: "bg-nf-secondary/60", border: "border-nf-border/20", glow: "" };
}
