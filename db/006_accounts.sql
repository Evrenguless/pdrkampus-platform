-- Apply in the NEW PDR Kampüs Supabase project, never in the existing analysis project.
-- Authentication itself is managed by Supabase Auth (auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
-- Browser clients cannot insert, update, or delete profiles directly.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,display_name)
  values (new.id, case when char_length(trim(new.raw_user_meta_data ->> 'display_name')) between 2 and 80
    then trim(new.raw_user_meta_data ->> 'display_name') else 'PDR Kampüs üyesi' end)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.create_profile_for_new_user();
