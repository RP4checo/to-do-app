// src/lib/enhance.ts
export type EnhancePayload = {
  id: string | number;
  title: string;
  description?: string | null;
  prompt: string; // required
};

export type EnhanceResponse = {
  // accept flexible keys from n8n; we'll normalize below
  title?: string;
  description?: string | null;
  enhancedTitle?: string;
  enhanced_description?: string | null;
  data?: { title?: string; description?: string | null };
  output?: { title?: string; description?: string | null };
};

const FALLBACK_URL = "https://n8n.synapticalhub.com/webhook/test-shadow-light";
const ENHANCE_URL = process.env.NEXT_PUBLIC_N8N_ENHANCE_URL || FALLBACK_URL;

export async function callEnhance(payload: EnhancePayload): Promise<{ title: string; description: string | null }> {
  // Client-side timeout via AbortController (~25s)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(ENHANCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: payload.id,
        title: payload.title,
        description: payload.description ?? null,
        prompt: payload.prompt,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Try to extract error text for visibility
      let msg = `Enhance request failed (${res.status})`;
      try {
        const t = await res.text();
        if (t) msg = `${msg}: ${t}`;
      } catch {}
      throw new Error(msg);
    }

    // Tolerant JSON parsing; accept flat or nested { data: { title, description } }
    let json: EnhanceResponse | undefined;
    try {
      json = await res.json();
    } catch {
      throw new Error("Invalid JSON response from enhance service");
    }

    const title = (json?.output?.title ?? json?.data?.title ?? json?.title ?? json?.enhancedTitle ?? payload.title) as string;
    const description = (json?.output?.description ?? json?.data?.description ?? json?.description ?? json?.enhanced_description ?? payload.description ?? null) as string | null;

    return { title, description };
  } catch (err: unknown) {
    const name = (err && typeof err === "object" && "name" in err) ? (err as { name?: unknown }).name : undefined;
    if (name === "AbortError") {
      throw new Error("Enhance request timed out. Please try again.");
    }
    // Network errors or thrown above
    const message = (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string")
      ? (err as { message: string }).message
      : "Network error during enhance request";
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}
