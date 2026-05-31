/** وقت نسبي مختصر للواجهة العربية */
export function timeAgoShort(ts?: string): string {
  if (!ts) return "الآن";
  try {
    const d = new Date(ts);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return "الآن";
    if (sec < 3600) return `منذ ${Math.floor(sec / 60)} د`;
    if (sec < 86400) return `منذ ${Math.floor(sec / 3600)} س`;
    if (sec < 604800) return `منذ ${Math.floor(sec / 86400)} ي`;
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  } catch {
    return "الآن";
  }
}
