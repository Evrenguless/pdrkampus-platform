-- Run in Supabase SQL Editor after reviewing project/auth settings.
-- The primary key prevents duplicate saves and each user can access only their rows.
create table if not exists public.user_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('form','resource')),
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id,kind,item_id)
);
create index if not exists user_bookmarks_user_idx on public.user_bookmarks(user_id,created_at desc);
alter table public.user_bookmarks enable row level security;
drop policy if exists user_bookmarks_owner_select on public.user_bookmarks;
drop policy if exists user_bookmarks_owner_insert on public.user_bookmarks;
drop policy if exists user_bookmarks_owner_delete on public.user_bookmarks;
create policy user_bookmarks_owner_select on public.user_bookmarks for select to authenticated using ((select auth.uid())=user_id);
create policy user_bookmarks_owner_insert on public.user_bookmarks for insert to authenticated with check ((select auth.uid())=user_id);
create policy user_bookmarks_owner_delete on public.user_bookmarks for delete to authenticated using ((select auth.uid())=user_id);
