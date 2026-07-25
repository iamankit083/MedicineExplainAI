-- Let users star/save an analysis.
alter table public.uploads
  add column if not exists saved boolean not null default false;

create index if not exists uploads_user_id_saved_idx
  on public.uploads (user_id, saved) where saved;

-- Shared cache of AI-generated medicine information, keyed by normalized name.
-- Readable by any signed-in user; written only by the server (service role),
-- so repeated searches for the same medicine don't re-call the AI.
create table if not exists public.medicine_lookups (
  id uuid primary key default gen_random_uuid(),
  query_key text not null unique,
  name text not null,
  summary text not null,
  uses text not null,
  dosage text not null,
  side_effects text[] not null default '{}',
  warnings text[] not null default '{}',
  storage text not null,
  created_at timestamptz not null default now()
);

alter table public.medicine_lookups enable row level security;

create policy "Authenticated users can read medicine lookups"
  on public.medicine_lookups for select
  to authenticated
  using (true);
