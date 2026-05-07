import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const TIMEOUT = 25000;
const MAX_TOKENS = 4000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, model, messages, apiKey, maxTokens, systemPrompt, temperature, top_p, presence_penalty, frequency_penalty } = body;

    // Use user's API key, or fall back to server-side key from env
    const effectiveKey = apiKey || process.env.AI_API_KEY || "";
    if (!effectiveKey || !provider || !model) {
      return NextResponse.json({ error: "أضف مفتاح API من الإعدادات — أو اضبط AI_API_KEY في .env.local" }, { status: 400 });
    }

    const tokens = maxTokens || MAX_TOKENS;
    const temp = temperature ?? 0.3;
    const topP = top_p ?? 0.9;
    const presPen = presence_penalty ?? 0.2;
    const freqPen = frequency_penalty ?? 0.3;
    const signal = AbortSignal.timeout(TIMEOUT);

    // Merge consecutive same-role messages to prevent API errors
    const mergedMessages: { role: string; content: string }[] = [];
    for (const m of messages) {
      const last = mergedMessages[mergedMessages.length - 1];
      if (last && last.role === m.role) { last.content += "\n" + m.content; }
      else { mergedMessages.push({ role: m.role, content: m.content }); }
    }

    let response: Response;

    switch (provider) {
      case "chatanywhere": {
        // Free ChatAnywhere has 4096 input token limit — truncate aggressively
        const caMaxTokens = Math.min(tokens, 1000);
        const caMsgs = mergedMessages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, 2000),
        }));
        if (systemPrompt) {
          caMsgs.unshift({ role: "system", content: systemPrompt.slice(0, 500) });
        }
        response = await fetch("https://api.chatanywhere.tech/v1/chat/completions", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveKey}` },
          body: JSON.stringify({ model: model || "gpt-3.5-turbo", messages: caMsgs, max_tokens: caMaxTokens, temperature: temp, top_p: topP }),
        });
        break;
      }

      case "chatgpt": {
        const msgs = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...mergedMessages]
          : mergedMessages;
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveKey}` },
          body: JSON.stringify({ model, messages: msgs, max_tokens: tokens, temperature: temp, top_p: topP, presence_penalty: presPen, frequency_penalty: freqPen }),
        });
        break;
      }

      case "deepseek": {
        const msgs = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...mergedMessages]
          : mergedMessages;
        response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveKey}` },
          body: JSON.stringify({ model, messages: msgs, max_tokens: tokens, temperature: temp, top_p: topP, presence_penalty: presPen, frequency_penalty: freqPen }),
        });
        break;
      }

      case "groq": {
        const msgs = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...mergedMessages]
          : mergedMessages;
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveKey}` },
          body: JSON.stringify({ model, messages: msgs, max_tokens: tokens, temperature: temp, top_p: topP, presence_penalty: presPen, frequency_penalty: freqPen }),
        });
        break;
      }

      case "mistral": {
        const msgs = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...mergedMessages]
          : mergedMessages;
        response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveKey}` },
          body: JSON.stringify({ model, messages: msgs, max_tokens: tokens, temperature: temp, top_p: topP, presence_penalty: presPen, frequency_penalty: freqPen }),
        });
        break;
      }

      case "gemini": {
        const contents = mergedMessages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));
        const bodyPayload: Record<string, unknown> = {
          contents,
          generationConfig: { maxOutputTokens: tokens, temperature: temp, topP: topP, presencePenalty: presPen, frequencyPenalty: freqPen },
        };
        if (systemPrompt) {
          bodyPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }
        // Try with systemInstruction first, fallback to inline if it fails
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`,
            { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyPayload) }
          );
          if (!response.ok && systemPrompt) {
            // Fallback: merge system prompt into first user message
            const fallbackContents = mergedMessages.map((m: { role: string; content: string }, i: number) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: i === 0 && m.role === "user" ? `${systemPrompt}\n\n${m.content}` : m.content }],
            }));
            const fallbackPayload = { contents: fallbackContents, generationConfig: { maxOutputTokens: tokens, temperature: temp, topP: topP } };
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`,
              { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(fallbackPayload) }
            );
          }
        } catch {
          throw new Error("انتهت مهلة الطلب — حاول مرة أخرى");
        }
        break;
      }

      case "claude": {
        const msgs = mergedMessages.filter((m: { role: string }) => m.role !== "system");
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", "x-api-key": effectiveKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: tokens, temperature: temp, top_p: topP, system: systemPrompt || undefined, messages: msgs }),
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.message || `HTTP ${response.status}`;
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "انتهت مهلة الطلب — حاول مرة أخرى" }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Lightweight connection test endpoint
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const apiKey = req.nextUrl.searchParams.get("apiKey") || process.env.AI_API_KEY || "";

  if (!provider || !apiKey) {
    return NextResponse.json({ ok: false, error: "Missing provider or apiKey" });
  }

  try {
    const signal = AbortSignal.timeout(10000);
    let testUrl: string;
    let testOpts: RequestInit;

    switch (provider) {
      case "chatanywhere":
        testUrl = "https://api.chatanywhere.tech/v1/models";
        testOpts = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        break;
      case "chatgpt":
        testUrl = "https://api.openai.com/v1/models";
        testOpts = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        break;
      case "deepseek":
        testUrl = "https://api.deepseek.com/v1/models";
        testOpts = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        break;
      case "groq":
        testUrl = "https://api.groq.com/openai/v1/models";
        testOpts = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        break;
      case "mistral":
        testUrl = "https://api.mistral.ai/v1/models";
        testOpts = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        break;
      case "gemini":
        testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        testOpts = { signal };
        break;
      case "claude":
        testUrl = "https://api.anthropic.com/v1/messages";
        testOpts = {
          method: "POST", signal,
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
        };
        break;
      default:
        return NextResponse.json({ ok: false, error: "Unknown provider" });
    }

    const res = await fetch(testUrl, testOpts);
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: false, error: errData?.error?.message || `HTTP ${res.status}` });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ ok: false, error: "انتهت المهلة" });
    }
    return NextResponse.json({ ok: false, error: "Network error" });
  }
}
