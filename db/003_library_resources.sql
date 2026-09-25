-- Public source catalogue. No personal/student data.
create table if not exists public.library_resources (
  id text primary key, title text not null, resource_type text not null,
  school_level text not null, area text not null, topic text not null,
  source_name text not null, source_page_url text not null,
  source_file_url text not null unique, file_type text not null,
  source_type text not null, storage_key text, link_checked_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists library_resources_filters_idx on public.library_resources(school_level,area,topic);
alter table public.library_resources enable row level security;
drop policy if exists library_resources_public_read on public.library_resources;
create policy library_resources_public_read on public.library_resources for select to anon, authenticated using (true);
