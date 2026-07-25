-- Uploads: reports & prescriptions the user has submitted for AI analysis.
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  mime_type text not null,
  size_bytes bigint not null default 0,
  kind text not null default 'report' check (kind in ('report', 'prescription')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'error')),
  extracted_text text,
  explanation text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists uploads_user_id_created_at_idx
  on public.uploads (user_id, created_at desc);

alter table public.uploads enable row level security;

create policy "Users can view their own uploads"
  on public.uploads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own uploads"
  on public.uploads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own uploads"
  on public.uploads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own uploads"
  on public.uploads for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists uploads_set_updated_at on public.uploads;
create trigger uploads_set_updated_at
  before update on public.uploads
  for each row execute function public.set_updated_at();

-- Storage: private bucket, one folder per user (folder name = auth.uid()).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-files',
  'medical-files',
  false,
  20971520, -- 20 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

create policy "Users can read their own files"
  on storage.objects for select
  using (bucket_id = 'medical-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (bucket_id = 'medical-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
  on storage.objects for delete
  using (bucket_id = 'medical-files' and (storage.foldername(name))[1] = auth.uid()::text);
