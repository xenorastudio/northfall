/** Full navigation to /app with query params — from standalone routes like /games */
export function goToAppView(view: string, extra: Record<string, string> = {}) {
  const qs = Object.entries({ view, ...extra })
    .filter(([_, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  window.location.href = `/app?${qs}`;
}
