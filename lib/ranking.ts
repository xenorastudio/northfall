// ─── Ranking System: صيت (Reputation) + XP (Points) ─────────────────
//
// صيت: from votes only, with diminishing returns based on content vote count
// XP: from posting only (+5 per post)
//
// Trust: gradual — based on time + real engagement + activity (not just posts)

export interface VoterData {
  accountAgeDays: number;  // days since account creation
  karma: number;           // صيت received from others (proof of real engagement)
  postCount: number;       // number of posts (activity level)
}

/** Calculate voter weight based on composite trust score (0.3 → 1.0) */
export function calcVoterWeight(data: VoterData): number {
  // Age factor (0→1): account must be at least 14 days old to start building trust
  const ageFactor = data.accountAgeDays < 14 ? 0
    : data.accountAgeDays < 60 ? ((data.accountAgeDays - 14) / 46) * 0.5
    : data.accountAgeDays < 180 ? 0.5 + ((data.accountAgeDays - 60) / 120) * 0.3
    : 0.8 + Math.min((data.accountAgeDays - 180) / 180, 1) * 0.2;

  // صيت factor (0→1): must have at least 10 صيت from others to start
  const saitFactor = data.karma < 10 ? 0
    : data.karma < 100 ? ((data.karma - 10) / 90) * 0.5
    : data.karma < 500 ? 0.5 + ((data.karma - 100) / 400) * 0.3
    : 0.8 + Math.min((data.karma - 500) / 500, 1) * 0.2;

  // Activity factor (0→1): must have at least 5 posts
  const activityFactor = data.postCount < 5 ? 0
    : data.postCount < 25 ? ((data.postCount - 5) / 20) * 0.5
    : data.postCount < 100 ? 0.5 + ((data.postCount - 25) / 75) * 0.3
    : 0.8 + Math.min((data.postCount - 100) / 100, 1) * 0.2;

  // Composite trust: age 40% + صيت 40% + activity 20%
  const trustScore = ageFactor * 0.4 + saitFactor * 0.4 + activityFactor * 0.2;
  // Weight range: 0.3 (brand new) → 1.0 (fully trusted)
  return 0.3 + 0.7 * trustScore;
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
  // Round to nearest integer to prevent floating-point accumulation in Firestore
  // Minimum 1 so every vote has at least some impact
  const rounded = Math.max(1, Math.round(raw));
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
