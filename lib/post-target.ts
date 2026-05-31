/** منشور على بروفايل المستخدم — ليس مجتمعاً */
export const PROFILE_POST_TARGET = "profile";
export const PROFILE_POST_COMMUNITY = "@profile";

export function isProfileOnlyPost(post: {
  community?: string;
  postTarget?: string;
}): boolean {
  if (post.postTarget === PROFILE_POST_TARGET) return true;
  const c = (post.community || "").trim().toLowerCase();
  return !c || c === "@profile" || c === "__profile__";
}

export function formatPostDestination(post: {
  community?: string;
  postTarget?: string;
  authorName?: string;
}): { prefix: "n" | "u"; label: string } {
  if (isProfileOnlyPost(post)) {
    const name = (post.authorName || "مستخدم").trim().replace(/\s+/g, "") || "مستخدم";
    return { prefix: "u", label: name };
  }
  return { prefix: "n", label: post.community || "عام" };
}

export function formatPostDestinationPath(post: Parameters<typeof formatPostDestination>[0]): string {
  const d = formatPostDestination(post);
  return `${d.prefix}/${d.label}`;
}

/** مسار العرض u/... — ليس مستنداً في communities */
export function isUserDestinationPath(display: string): boolean {
  const d = display.trim().toLowerCase();
  return d.startsWith("u/") || d.startsWith("@");
}

/** معرّف مجتمع لـ Firestore (بدون شرطة مائلة) — null للبروفايل أو مسار غير صالح */
export function firestoreCommunityIdFromDisplay(display: string): string | null {
  const raw = display.trim();
  if (!raw || isUserDestinationPath(raw)) return null;
  const id = raw.replace(/^n\//i, "").trim();
  if (!id || id.includes("/")) return null;
  return id;
}
