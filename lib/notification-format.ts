import { plainAr } from "@/lib/arabic-text";

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
  if (n.actors?.length) {
    const a = n.actors[0];
    if (a.name && !/^\d+x?$/i.test(a.name.trim())) return a;
  }
  if (n.fromUid && n.fromName && !/^\d+x?$/i.test(n.fromName.trim())) {
    return { uid: n.fromUid, name: n.fromName, photo: n.fromPhoto };
  }
  return null;
}

export function formatFollowText(n: NotificationLike): string {
  const actors = n.actors?.filter((a) => a.name && !/^\d+x?$/i.test(a.name)) || [];
  const lead = primaryActor(n);
  const list = actors.length ? actors : lead ? [lead] : [];
  const count = Math.max(n.count || 0, list.length, 1);

  if (count <= 1 && list[0]) return plainAr(`${list[0].name} تابعك`);
  if (count === 2 && list.length >= 2) {
    return plainAr(`${list[0].name} و ${list[1].name} تابعوك`);
  }
  if (list[0]) return plainAr(`${list[0].name} و ${count - 1} آخرين تابعوك`);
  return plainAr(n.text || "متابعة جديدة");
}

export function formatVoteText(n: NotificationLike): string {
  const name = n.fromName || n.lastVoterName || n.actors?.[0]?.name || "مستخدم";
  const title = truncate(n.postTitle || extractQuotedTitle(n.text) || "منشورك", 48);
  const count = n.count || 1;
  if (count <= 1) return plainAr(`${name} صوت على «${title}»`);
  return plainAr(`${count} أشخاص صوتوا على «${title}»`);
}

export function formatCommentText(n: NotificationLike): string {
  const name = n.fromName || n.lastCommenterName || n.actors?.[0]?.name || "مستخدم";
  const title = truncate(n.postTitle || extractQuotedTitle(n.text) || "منشورك", 48);
  const count = n.count || 1;
  if (count <= 1) return plainAr(`${name} علق على «${title}»`);
  return plainAr(`${count} أشخاص علقوا على «${title}»`);
}

export function formatReplyText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  return plainAr(`${name} رد على تعليقك`);
}

export function formatMentionText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  return plainAr(`${name} أشار إليك`);
}

export function formatInviteText(n: NotificationLike): string {
  const name = n.fromName || n.actors?.[0]?.name || "مستخدم";
  const comm = n.community ? `n/${n.community}` : "مجتمع";
  return plainAr(`${name} دعاك للانضمام إلى ${comm}`);
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
      return plainAr(n.text || n.message || "إشعار جديد");
  }
}

export function notificationActorLabel(n: NotificationLike): string {
  const actor = primaryActor(n);
  if (actor?.name) return actor.name;
  const raw = n.text || n.message || "";
  const m = raw.match(/^(.+?)\s+(تابع|علق|صوت|رد)/);
  const name = m?.[1]?.trim();
  if (name && !/^\d+x?$/i.test(name)) return name;
  return "مستخدم";
}

export function notificationActionText(n: NotificationLike): string {
  const actor = primaryActor(n);
  const full = formatNotificationPrimary(n);
  if (!actor) return full;
  if (full.startsWith(actor.name)) return full.slice(actor.name.length).trim();
  return full;
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
  if (/^\d+x?$/i.test(n)) return "؟";
  return (n[0] || "U").toUpperCase();
}
