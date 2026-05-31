const BORDERED_KEY = "nf-post-bordered";

export function getPostBorderedPref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BORDERED_KEY) === "true";
}

export function setPostBorderedPref(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BORDERED_KEY, String(on));
  window.dispatchEvent(new CustomEvent("nf-display-prefs"));
}
