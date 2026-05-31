export const BOWIE_KNIFE_LABEL = "Bowie Knife | 99";

const GLITCH_FRAMES = [
  "N0rthF@ll",
  "B0wie Kn1fe",
  "Bowie Kn!fe",
  "Bowie Knife 99",
  "B0wie Knife 99",
  "Bowie Knife | 99",
];

export type BowieGlitchDetail = {
  phase: "glitch" | "reveal" | "done";
  label?: string;
};

export function triggerBowieKnifeEasterEgg() {
  if (typeof document === "undefined") return;

  const savedTitle = document.title;
  let step = 0;
  const total = GLITCH_FRAMES.length * 2 + 2;

  const tick = window.setInterval(() => {
    const frame = GLITCH_FRAMES[step % GLITCH_FRAMES.length];
    const isReveal = step >= GLITCH_FRAMES.length * 2;

    if (isReveal) {
      document.title = BOWIE_KNIFE_LABEL;
      window.dispatchEvent(
        new CustomEvent<BowieGlitchDetail>("nf-bowie-glitch", {
          detail: { phase: "reveal", label: BOWIE_KNIFE_LABEL },
        })
      );
    } else {
      document.title = frame;
      window.dispatchEvent(
        new CustomEvent<BowieGlitchDetail>("nf-bowie-glitch", {
          detail: { phase: "glitch", label: frame },
        })
      );
    }

    step += 1;
    if (step >= total) {
      window.clearInterval(tick);
      window.setTimeout(() => {
        document.title = savedTitle;
        window.dispatchEvent(
          new CustomEvent<BowieGlitchDetail>("nf-bowie-glitch", {
            detail: { phase: "done" },
          })
        );
      }, 2400);
    }
  }, 75);
}
