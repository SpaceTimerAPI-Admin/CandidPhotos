-- Storage bucket (create via Supabase dashboard as 'photos', private)
-- Table to track photos
create table if not exists public.photos (
  id uuid primary key,
  path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  download_count int not null default 0
);

-- RLS: allow no anonymous access; all actions done via service role in Netlify Functions.
alter table public.photos enable row level security;
create policy "service-only" on public.photos for all using (false);
