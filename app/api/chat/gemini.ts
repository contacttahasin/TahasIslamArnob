/**
 * Minimal Gemini client for the chat widget.
 *
 * Deliberately a hand-rolled `fetch` rather than `@google/genai`: the route
 * needs one endpoint, and the SDK is a few megabytes of dependency for a
 * request body this small.
 *
 * Everything here is server-only. `GEMINI_API_KEY` must never gain a
 * `NEXT_PUBLIC_` prefix — that would bundle it into the browser JS and hand
 * the key to anyone who opens devtools.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Tried in order — the first model the key is allowed to call wins, which
 * keeps the route alive when a model is retired.
 *
 * Only `gemini-3.6-flash` answers for the current key; every other flash
 * model tested (2.5, 3.5, 3.7, 3.8, `gemini-flash-latest`) returns 404 "no
 * longer available to new users". The rest are here as forward cover for
 * when the account gains access or 3.6 is itself retired.
 */
const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/**
 * Gemini 3 spends thinking tokens out of the same budget as the reply, so a
 * widget-sized 600 would leave almost nothing for visible text. The cap sits
 * well above what an answer needs.
 */
const MAX_OUTPUT_TOKENS = 2048;

/**
 * `minimal` is the only setting that actually stops the thinking spend on
 * this model: leaving `thinkingConfig` off burns ~360 thinking tokens per
 * reply, `low` still burns ~290, and 2.5's `thinkingBudget: 0` is rejected
 * outright as an invalid argument. Answer quality is unchanged for the kind
 * of question a portfolio widget gets.
 */
const THINKING_LEVEL = "minimal";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type GeminiPart = {
  text?: string;
  /** Set on reasoning parts, which must not be shown to the visitor. */
  thought?: boolean;
  /** Opaque reasoning blob that rides alongside the text parts. */
  thoughtSignature?: string;
};

type GeminiResponse = {
  candidates?: {
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }[];
  error?: { code?: number; message?: string; status?: string };
};

/** Thrown when every candidate model failed, so the route can fall back. */
export class GeminiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

/**
 * A candidate's parts mix visible text with reasoning. Only plain text parts
 * belong in the reply — `thought` parts are Gemini's scratchpad, and a part
 * carrying just a `thoughtSignature` has no text at all.
 */
function extractText(response: GeminiResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

async function callModel(
  model: string,
  systemPrompt: string,
  messages: ChatTurn[],
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    signal,
    headers: {
      // Header rather than a `?key=` query param, so the key never lands in
      // a proxy or server access log.
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      // Gemini calls the assistant "model"; the widget calls it "assistant".
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: { thinkingLevel: THINKING_LEVEL },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;

  if (!response.ok) {
    throw new GeminiError(
      payload?.error?.message ?? `Gemini responded ${response.status}`,
      response.status
    );
  }

  const reply = extractText(payload ?? {});
  if (!reply) {
    // Empty text with MAX_TOKENS means thinking consumed the whole budget;
    // any other empty answer is a safety block or a malformed candidate.
    const finish = payload?.candidates?.[0]?.finishReason ?? "unknown";
    throw new GeminiError(`Gemini returned no text (finishReason: ${finish})`);
  }

  return reply;
}

/**
 * Asks Gemini for a reply, walking the candidate list on model-availability
 * errors only. An auth failure, a rate limit or a network fault is not fixed
 * by a different model, so those stop the walk immediately.
 */
export async function generateGeminiReply(
  systemPrompt: string,
  messages: ChatTurn[],
  signal?: AbortSignal
): Promise<{ reply: string; model: string }> {
  let lastError: unknown = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      const reply = await callModel(model, systemPrompt, messages, signal);
      return { reply, model };
    } catch (error) {
      lastError = error;
      const status = error instanceof GeminiError ? error.status : undefined;
      if (status !== 400 && status !== 404) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new GeminiError("Gemini request failed.");
}
