export type CommunityPrivacy = "public" | "restricted" | "private";

export function resolveCommunityType(data?: {
  communityType?: string;
  modLevel?: string;
} | null): CommunityPrivacy {
  if (data?.communityType === "private" || data?.communityType === "restricted" || data?.communityType === "public") {
    return data.communityType;
  }
  if (data?.modLevel === "restrict") return "private";
  if (data?.modLevel === "moderate") return "restricted";
  return "public";
}

export function canViewCommunityContent(opts: {
  type: CommunityPrivacy;
  isOwner: boolean;
  isStaff: boolean;
  isMember: boolean;
  isPreview?: boolean;
}): boolean {
  if (opts.isPreview) return true;
  if (opts.type !== "private") return true;
  return opts.isOwner || opts.isStaff || opts.isMember;
}

export function canPostInCommunity(opts: {
  type: CommunityPrivacy;
  isOwner: boolean;
  isStaff: boolean;
  isMember: boolean;
  isLoggedIn: boolean;
}): boolean {
  if (!opts.isLoggedIn) return false;
  if (opts.type === "public") return true;
  if (opts.type === "restricted") return opts.isOwner || opts.isStaff;
  return opts.isOwner || opts.isMember;
}

export const COMMUNITY_PRIVACY_OPTIONS: {
  value: CommunityPrivacy;
  label: string;
}[] = [
  { value: "public", label: "عام — الكل يرى وينشر" },
  { value: "restricted", label: "مقيد — الكل يرى، المشرفون والمالك ينشرون فقط" },
  { value: "private", label: "خاص — الأعضاء المعتمدون فقط يرون وينشرون" },
];
