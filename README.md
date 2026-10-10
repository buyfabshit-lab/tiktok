# mf-drops

Midnight Fusion drops: upload videos and pictures, take them down, let people download or upload their own

Built on the Midnight Fusion house stack: Vite + React + TypeScript, Supabase behind RLS and security-definer functions, Railway from `main`, one reviewed PR per increment.

- Plan and changelog: [docs/plan.md](docs/plan.md)
- Go-live checklist: [docs/go-live.md](docs/go-live.md)

```
pnpm install
pnpm dev          # local, needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
pnpm test         # vitest
pnpm e2e          # Playwright on the demo build, no database needed
```
