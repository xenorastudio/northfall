export interface NotificationActor {
  uid: string;
  name: string;
  photo?: string;
}

export interface NotificationLike {
  type?: string;
  text?: string;
  message?: string;
  count?: number;
  fromUid?: string;
  fromName?: string;
  fromPhoto?: string;
  actors?: NotificationActor[];
  postTitle?: string;
  postId?: string;
  community?: string;
  lastVoterName?: string;
  lastCommenterName?: string;
}

export function mergeActor(
  prev: NotificationActor[] | undefined,
  actor: NotificationActor,
  max = 5
): NotificationActor[] {
  const list = [...(prev || [])];
  const idx = list.findIndex((a) => a.uid === actor.uid);
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(actor);
  return list.slice(0, max);
}

export function primaryActor(n: NotificationLike): NotificationActor | null {
  if (n.fromUid && n.fromName) {
    return { uid: n.fromUid, name: n.fromName, photo: n.fromPhoto };
  }
  if (n.actors?.length) return n.actors[0];
  return null;
}

export function formatFollowText(n: NotificationLike): string {
  const actors = n.actors?.length ? n.actors : primaryActor(n) ? [primaryActor(n)!] : [];
  const count = n.count || actors.length || 1;
  if (count <= 1 && actors[0]) return `${actors[0].name} تابعك`;
  if (count === 2 && actors.length >= 2) return `${actors[0].name} و ${actors[1].name} تابعوك`;
  if (actors[0]) return `${actors[0].name} و ${count - 1} آخرين تابعوك`;
  return n.text || "متابعة جديدة";
}

export function formatVoteText(n: NotificationLike): string {
  const name = n.fromName || n.lastVoterName || n.actors?.[0]?.name || "مستخدم";
  const title = truncate(n.postTitle || extractQuotedTitle(n.text) || "منشورك", 48);
  const count = n.count || 1;
  if (count <= 1) return `${name} صوّت على «${title}»`;
  return `${count} أشخاص صوّتوا على «${title}»`;
}

export function formatCommentText(n: NotificationLike): string {
  const name = n.fromName || n.lastCommenterName || n.actors?.[0]?.name || "مستخدم";
  const title = truncate(n.postTitle || extractQuotedTitle(n.text) || "منشورك", 48);
  const count = n.count || 1;
  if (count <= 1) return `${name} علّق على «${title}»`;
  return `${count} أشخاص علّقوا على «${title}»`;
}

export function formatReplyText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  return `${name} ردّ على تعليقك`;
}

export function formatMentionText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  return `${name} أشار إليك`;
}

export function formatInviteText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  const comm = n.community ? `n/${n.community}` : "مجتمع";
  return `${name} دعاك للانضمام إلى ${comm}`;
}

export function formatNotificationPrimary(n: NotificationLike): string {
  switch (n.type) {
    case "follow":
      return formatFollowText(n);
    case "vote":
      return formatVoteText(n);
    case "comment":
      return formatCommentText(n);
    case "reply":
      return formatReplyText(n);
    case "mention":
      return formatMentionText(n);
    case "invite":
      return formatInviteText(n);
    default:
      return n.text || n.message || "إشعار جديد";
  }
}

export function notificationActorLabel(n: NotificationLike): string {
  const actor = primaryActor(n);
  if (actor?.name) return actor.name;
  const raw = n.text || n.message || "";
  const m = raw.match(/^(.+?)\s+(تابع|علّق|صوّت|رد)/);
  return m?.[1] || "مستخدم";
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function extractQuotedTitle(text?: string): string | null {
  if (!text) return null;
  const m = text.match(/"([^"]+)"/);
  return m?.[1] || null;
}

export function actorInitial(name: string): string {
  const n = (name || "U").replace(/^u\//, "").trim();
  return (n[0] || "U").toUpperCase();
}
