// src/lib/enhance.ts
export type EnhancePayload = {
  id: string | number;
  title: string;
  description?: string | null;
  prompt?: string;
};

export type EnhanceResponse = {
  // accept flexible keys from n8n; we'll normalize below
  title?: string;
  description?: string | null;
  enhancedTitle?: string;
  enhanced_description?: string | null;
  data?: { title?: string; description?: string | null };
};

const ENHANCE_URL = process.env.NEXT_PUBLIC_N8N_ENHANCE_URL;

if (!ENHANCE_URL) {
  // We don't throw (to avoid crashing in dev); caller handles null
  console.warn("Missing NEXT_PUBLIC_N8N_ENHANCE_URL in .env.local");
}

export async function callEnhance(payload: EnhancePayload): Promise<{title: string; description: string | null}> {
  if (!ENHANCE_URL) return { title: payload.title, description: payload.description ?? null };

  const res = await fetch(ENHANCE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Tolerant parsing
  let json: EnhanceResponse | undefined;
  try { json = await res.json(); } catch { /* noop */ }

  // Prefer explicit enhanced keys, then flat, then nested data
  const fromEnhanced =
    (json?.enhancedTitle ?? json?.title ?? json?.data?.title ?? payload.title);
  const fromDesc =
    (json?.enhanced_description ?? json?.description ?? json?.data?.description ?? payload.description ?? null);

  return { title: fromEnhanced, description: fromDesc };
}

