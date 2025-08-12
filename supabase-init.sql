-- Create a private bucket named 'photos' in Supabase Storage before using this.

create table if not exists public.photos (
  id uuid primary key,
  path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.photos enable row level security;
create policy "service-only-photos" on public.photos for all using (false);
