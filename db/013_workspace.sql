-- Run after 012 in the new platform Supabase project.
-- Do not store student names, sensitive case notes, or counseling records here.
create table if not exists public.workspace_notes (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 120),
 body text not null check (char_length(trim(body)) between 1 and 3000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists workspace_notes_owner_recent on public.workspace_notes(owner_id,updated_at desc);
alter table public.workspace_notes enable row level security;
revoke all on public.workspace_notes from public,anon,authenticated;
grant select,insert,update,delete on public.workspace_notes to authenticated;
create policy workspace_notes_own on public.workspace_notes for all to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create table if not exists public.workspace_tasks (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 3 and 180),
 due_date date,completed boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists workspace_tasks_owner_due on public.workspace_tasks(owner_id,completed,due_date);
alter table public.workspace_tasks enable row level security;
revoke all on public.workspace_tasks from public,anon,authenticated;
grant select,insert,update,delete on public.workspace_tasks to authenticated;
create policy workspace_tasks_own on public.workspace_tasks for all to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create table if not exists public.workspace_saved_items (
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('tool','library','community_file')),
 ref_id text not null check (char_length(ref_id) between 1 and 500),
 created_at timestamptz not null default now(),
 primary key(owner_id,kind,ref_id)
);
alter table public.workspace_saved_items enable row level security;
revoke all on public.workspace_saved_items from public,anon,authenticated;
grant select,insert,delete on public.workspace_saved_items to authenticated;
create policy workspace_saved_items_own on public.workspace_saved_items for all to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
