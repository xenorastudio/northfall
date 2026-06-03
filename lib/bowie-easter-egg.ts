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
  // Easter egg disabled
}
