export type PollData = {
  options: string[];
  votes: number[];
  duration: string;
  endsAt?: string;
  optionImages?: string[];
};

export function pollDurationMs(duration: string): number {
  switch (duration) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "3d":
      return 3 * 24 * 60 * 60 * 1000;
    case "1w":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function computePollEndsAt(duration: string, from = new Date()): string {
  return new Date(from.getTime() + pollDurationMs(duration)).toISOString();
}

/** Legacy posts without endsAt stay open; new posts use endsAt */
export function isPollExpired(poll: PollData, createdAt?: string | number | Date): boolean {
  if (poll.endsAt) {
    return new Date(poll.endsAt).getTime() <= Date.now();
  }
  if (!createdAt) return false;
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return false;
  return Date.now() > start + pollDurationMs(poll.duration);
}

export function pollDurationLabel(duration: string): string {
  switch (duration) {
    case "24h":
      return "24 ساعة";
    case "3d":
      return "3 أيام";
    case "1w":
      return "أسبوع";
    default:
      return duration;
  }
}

export function pollStatusLabel(poll: PollData, createdAt?: string | number | Date): string {
  if (isPollExpired(poll, createdAt)) return "انتهى الاستطلاع";
  if (poll.endsAt) {
    const ms = new Date(poll.endsAt).getTime() - Date.now();
    if (ms <= 0) return "انتهى الاستطلاع";
    const h = Math.ceil(ms / (60 * 60 * 1000));
    if (h < 24) return `ينتهي خلال ${h} س`;
    const d = Math.ceil(h / 24);
    return `ينتهي خلال ${d} ي`;
  }
  return `المدة: ${pollDurationLabel(poll.duration)}`;
}

export function buildPollPayload(
  options: { text: string; imageUrl: string }[],
  duration: string
): PollData {
  const valid = options.filter((o) => o.text.trim());
  return {
    options: valid.map((o) => o.text.trim()),
    optionImages: valid.map((o) => o.imageUrl.trim()),
    duration,
    endsAt: computePollEndsAt(duration),
    votes: valid.map(() => 0),
  };
}
