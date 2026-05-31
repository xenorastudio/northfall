/**
 * Free translation using Google Translate unofficial endpoint.
 * No API key required. Detects source language automatically.
 * Smart target: if detected == preferred → use opposite, else use preferred.
 * Uses "nf-translate-lang" key (separate from AI translate lang).
 */
export async function translateText(text: string): Promise<string> {
  const preferred =
    (typeof window !== "undefined"
      ? localStorage.getItem("nf-translate-lang") || localStorage.getItem("nf-ai-translate-lang")
      : null) || "ar";

  // Step 1: detect language
  const detectUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.slice(0, 150))}`;
  const detectRes = await fetch(detectUrl);
  const detectData = await detectRes.json();
  const detected: string = detectData?.[2] || "en";

  // Step 2: pick target — smart flip
  let target: string;
  if (detected === preferred) {
    target = preferred === "ar" ? "en" : "ar";
  } else {
    target = preferred;
  }

  // Step 3: translate
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.[0]?.map((c: any[]) => c?.[0] || "").join("") || "";
}
