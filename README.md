# MediExplain AI

Upload blood tests, medical reports, or handwritten prescriptions and get clear,
AI-powered explanations in plain language.

## Stack

- TanStack Start (React, file-based routing, SSR)
- TypeScript + Tailwind CSS
- Supabase (auth, Postgres, storage)
- Anthropic Claude (OCR + plain-language explanations)

## Development

You need Node.js 20+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your own values:

- `SUPABASE_URL` / `VITE_SUPABASE_URL` — your Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only, never exposed to the client)
- `ANTHROPIC_API_KEY` — used server-side to OCR and explain uploaded reports/prescriptions

## Database & storage setup

Run the SQL in `supabase/migrations/` against your Supabase project, in order
(via the SQL editor or `supabase db push`):

- `0001_uploads.sql` — the `uploads` table, the `medical-files` storage bucket, and RLS
- `0002_saved_and_medicines.sql` — a `saved` flag on uploads, and a shared `medicine_lookups` cache

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — lint
- `npm run format` — format with Prettier
