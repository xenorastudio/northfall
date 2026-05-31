/** Full navigation to /app with query params — reliable from standalone routes like /games */
export function goToAppView(view: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ view, ...extra });
  window.location.assign(`/app?${params.toString()}`);
}
