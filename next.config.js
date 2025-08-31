// next.config.js
const path = require("path");
const fs = require("fs");

function readEnvLine(filePath, key) {
  try {
    const raw = fs.readFileSync(filePath);
    // strip BOM if present
    const txt = raw.toString("utf8").replace(/^\uFEFF/, "");
    const re = new RegExp(`^${key}=(.*)$`, "m");
    const m = txt.match(re);
    return m ? m[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

const envPath = path.resolve(__dirname, ".env.local");

const env = {
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    readEnvLine(envPath, "NEXT_PUBLIC_SUPABASE_URL") ||
    "https://wolpburzgnjnmxgnudbf.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    readEnvLine(envPath, "NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHB1cnpnbmpubXhnbnVkYmYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NjUyODczNywiZXhwIjoyMDcyMTA0NzM3fQ.zlN0B2AzUFsDwGv_-oW9Q3UWL8NDGnC8qTkeGdyW2Gg",
  NEXT_PUBLIC_N8N_ENHANCE_URL:
    process.env.NEXT_PUBLIC_N8N_ENHANCE_URL ||
    readEnvLine(envPath, "NEXT_PUBLIC_N8N_ENHANCE_URL") ||
    "https://n8n.synapticalhub.com/webhook/test-shadow-light",
};

/** @type {import('next').NextConfig} */
module.exports = {
  env,
};
