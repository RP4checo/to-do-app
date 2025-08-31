// src/app/env-check/page.tsx
"use client";

export default function EnvCheckPage() {
  return (
    <pre className="p-4 text-sm whitespace-pre-wrap">
{JSON.stringify({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? "[present]" : "[missing]",
  NEXT_PUBLIC_N8N_ENHANCE_URL: process.env.NEXT_PUBLIC_N8N_ENHANCE_URL
}, null, 2)}
    </pre>
  );
}
