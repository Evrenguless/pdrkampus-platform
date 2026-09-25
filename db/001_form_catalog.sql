-- PostgreSQL / Supabase migration. Student records do not belong in this table.
create table if not exists public.form_catalog (
  id text primary key,
  form_code text not null,
  title text not null,
  main_group text not null check (main_group in ('Bireyi Tanıma','Sistem Formları')),
  category text not null,
  school_level text not null,
  usage_location text not null,
  file_type text not null check (file_type in ('PDF','XLSX')),
  source_type text not null default 'MEB',
  source_document_url text not null,
  source_file_url text not null unique,
  storage_key text,
  link_checked_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists form_catalog_group_category_idx on public.form_catalog(main_group, category);
create index if not exists form_catalog_level_idx on public.form_catalog(school_level);
alter table public.form_catalog enable row level security;
drop policy if exists form_catalog_public_read on public.form_catalog;
create policy form_catalog_public_read on public.form_catalog for select to anon, authenticated using (true);
-- No client insert/update/delete policy. Admin import uses the SQL editor or a server role.
