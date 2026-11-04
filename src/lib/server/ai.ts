import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** Modelos mais leves para correcção simples, mais capazes para níveis avançados (secção 8.6). */
export function modelFor(level: number): string {
  const light = process.env.ANTHROPIC_MODEL_LIGHT || "claude-haiku-4-5";
  const smart = process.env.ANTHROPIC_MODEL_SMART || "claude-sonnet-4-5";
  return level <= 18 ? light : smart;
}

export async function complete(system: string, messages: { role: "user" | "assistant"; content: string }[], level: number) {
  const res = await getClient().messages.create({
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
