-- Run after 014 in the NEW platform project. Existing JSON catalogues stay intact.
create table if not exists public.curated_resources (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('tool','library')),
 title text not null check (char_length(trim(title)) between 5 and 180),
 code text not null default '',
 group_name text,
 category text,
 location text,
 area text,
 topic text,
 level text not null default 'Belirtilmiyor' check (level in ('Okul öncesi','İlkokul','Ortaokul','Lise','Tüm kademeler','Belirtilmiyor')),
 resource_type text not null default 'Form' check (resource_type in ('Form','Sunum','Etkinlik kitabı','Farkındalık programı','Program','Broşür','Mesleki kaynak')),
 file_type text not null check (file_type in ('PDF','XLSX')),
 file_url text not null check (file_url ~ '^https://([a-z0-9-]+[.])*meb[.]gov[.]tr/'),
 source_page_url text check (source_page_url is null or source_page_url ~ '^https://([a-z0-9-]+[.])*meb[.]gov[.]tr/'),
 status text not null default 'draft' check (status in ('draft','published','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint curated_kind_fields check (
   (kind='tool' and group_name in ('Bireyi Tanıma','Sistem Formları') and category is not null and char_length(trim(category))>=2 and location in ('Okul','RAM','Okul ve RAM','Belirtilmiyor'))
   or (kind='library' and area is not null and topic is not null and char_length(trim(area))>=2 and char_length(trim(topic))>=2)
 ),
 unique(kind,file_url)
);
create index if not exists curated_resources_public_index on public.curated_resources(kind,status,created_at desc);
alter table public.curated_resources enable row level security;
revoke all on public.curated_resources from public,anon,authenticated;
grant select on public.curated_resources to anon,authenticated;
grant insert,update on public.curated_resources to authenticated;
create policy curated_resources_read on public.curated_resources for select to anon,authenticated
 using (status='published' or public.is_community_moderator());
create policy curated_resources_insert on public.curated_resources for insert to authenticated
 with check (public.is_community_moderator());
create policy curated_resources_update on public.curated_resources for update to authenticated
 using (public.is_community_moderator()) with check (public.is_community_moderator());

create table if not exists public.curated_resources_audit (
 id bigint generated always as identity primary key,
 resource_id uuid not null references public.curated_resources(id) on delete restrict,
 actor_id uuid references auth.users(id),
 before_values jsonb,after_values jsonb not null,changed_at timestamptz not null default now()
);
alter table public.curated_resources_audit enable row level security;
revoke all on public.curated_resources_audit from public,anon,authenticated;
create or replace function public.audit_curated_resource()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.curated_resources_audit(resource_id,actor_id,before_values,after_values)
 values (new.id,(select auth.uid()),case when tg_op='INSERT' then null else to_jsonb(old) end,to_jsonb(new));
 return new;
end;
$$;
revoke all on function public.audit_curated_resource() from public,anon,authenticated;
drop trigger if exists on_curated_resource_change on public.curated_resources;
create trigger on_curated_resource_change after insert or update on public.curated_resources
 for each row execute function public.audit_curated_resource();
