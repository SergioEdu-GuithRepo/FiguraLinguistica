import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

export type AiProvider = "anthropic" | "gemini" | "groq" | "openai" | "none";

export function activeAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim()) return "gemini";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "none";
}

export function aiEnabled(): boolean {
  return activeAiProvider() !== "none";
}

function getAnthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

/** Modelos mais leves para níveis iniciais, mais capazes para níveis avançados. */
export function modelFor(level: number): string {
  const light = process.env.ANTHROPIC_MODEL_LIGHT || "claude-haiku-4-5";
  const smart = process.env.ANTHROPIC_MODEL_SMART || "claude-sonnet-4-5";
  return level <= 18 ? light : smart;
}

export async function complete(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  level: number,
): Promise<string> {
  const provider = activeAiProvider();

  if (provider === "anthropic") {
    const res = await getAnthropic().messages.create({
      model: modelFor(level),
      max_tokens: 700,
      system,
      messages,
    });
    return res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
  }

  if (provider === "gemini") {
    const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: 700, temperature: 0.5 },
        }),
      },
    );
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const j = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  }

  if (provider === "groq" || provider === "openai") {
    const isGroq = provider === "groq";
    const key = (isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY)?.trim() ?? "";
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = isGroq
      ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
      : process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.5,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!r.ok) throw new Error(`${provider} HTTP ${r.status}`);
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return j.choices?.[0]?.message?.content ?? "";
  }

  throw new Error("Nenhum motor de IA configurado");
}
