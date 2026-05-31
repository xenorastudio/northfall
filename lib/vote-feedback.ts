/** تأثير زر الإعجاب / عدم الإعجاب */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function triggerVoteButtonPop(btn: HTMLElement, tone: "up" | "down"): void {
  if (prefersReducedMotion()) return;

  btn.getAnimations().forEach((a) => a.cancel());

  const peak = tone === "up" ? 1.28 : 1.22;
  btn.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${peak})`, offset: 0.38 },
      { transform: "scale(1)" },
    ],
    {
      duration: tone === "up" ? 300 : 250,
      easing: "cubic-bezier(0.22, 1.28, 0.32, 1)",
      fill: "forwards",
    }
  );
}

export function triggerVoteFeedback(
  tone: "up" | "down",
  fromEl?: HTMLElement | null
): void {
  if (fromEl instanceof HTMLElement) triggerVoteButtonPop(fromEl, tone);
}
