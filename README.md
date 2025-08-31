# To‑Do App (Next.js + Supabase)

A simple To‑Do web app with Supabase persistence and realtime updates, plus an optional “Enhance with AI” modal powered by an n8n webhook to refine a task’s title/description before saving.

## Features
- Add, edit, complete, and delete tasks
- Realtime list updates via Supabase channels
- “Enhance with AI” modal: calls an n8n webhook, updates modal fields locally, applies to DB only on confirm

## Tech Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Supabase (database + realtime)
- n8n (webhook for AI enhancement)

## Project Structure
```
src/
  app/                # Routes & layouts (public paths unchanged)
  lib/                # Supabase, n8n client, constants
  types/              # Shared TypeScript types
  styles/             # Global styles (Tailwind via globals.css)
```

## Quick Start
1. Prerequisites: Node 18+
2. Install: `npm install`
3. Env vars (add to `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_N8N_ENHANCE_URL` (optional; falls back to a test URL)
4. Dev: `npm run dev`
5. Build: `npm run build`
6. Start: `npm run start`

## Linting & Formatting
- Lint: `npm run lint`
- Project uses ESLint and Tailwind; formatting is handled by the toolchain.

## Deployment
- Deploy as a standard Next.js app (Vercel or Node host). Ensure env vars are set in the host.

## Data Flow (high‑level)
- UI ↔ Supabase: CRUD ops and realtime updates for the `todos` table.
- UI ↔ n8n Webhook: POST `{ id, title, description, prompt }`; response normalizes to `{ title, description }` and updates modal inputs only. Persist on “Apply”.

## Security Notes
- Do not commit secrets. Only public, anonymous Supabase key is used client‑side.
- Assume RLS policies on tables as appropriate.
