-- Apply ONLY to the new platform Supabase project after db/006_accounts.sql.
-- Do NOT apply the older db/005_community_documents_draft.sql; it is a design draft.
-- Private bucket: no public object URLs. Approved files require short-lived signed URLs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-documents','community-documents',false,20971520,
 array['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.community_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.community_moderators enable row level security;
revoke all on public.community_moderators from public,anon,authenticated;

create or replace function public.is_community_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.community_moderators where user_id = (select auth.uid()));
$$;
revoke all on function public.is_community_moderator() from public,anon;
grant execute on function public.is_community_moderator() to anon,authenticated;

create table if not exists public.community_documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 5 and 180),
  description text not null default '',
  document_type text not null check (document_type in ('Sunum','Etkinlik','Çalışma kağıdı','Veli materyali','Öğretmen materyali','Diğer')),
  level text not null check (level in ('Okul öncesi','İlkokul','Ortaokul','Lise','Tüm kademeler')),
  topic text not null check (char_length(trim(topic)) between 2 and 80),
  file_storage_key text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  rights_confirmed boolean not null check (rights_confirmed),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint document_owner_path check (split_part(file_storage_key,'/',1)=uploader_id::text),
  constraint document_review_metadata check ((review_status='pending' and reviewer_id is null and reviewed_at is null)
    or (review_status in ('approved','rejected') and reviewer_id is not null and reviewed_at is not null))
);
create index if not exists community_documents_review_idx on public.community_documents(review_status,created_at desc);
alter table public.community_documents enable row level security;
revoke all on public.community_documents from public,anon,authenticated;
grant select on public.community_documents to anon,authenticated;
grant insert on public.community_documents to authenticated;
grant update(review_status,reviewer_id,reviewed_at,review_note) on public.community_documents to authenticated;
drop policy if exists community_docs_read on public.community_documents;
drop policy if exists community_docs_insert on public.community_documents;
drop policy if exists community_docs_moderate on public.community_documents;
create policy community_docs_read on public.community_documents for select to anon,authenticated
 using (review_status='approved' or uploader_id=(select auth.uid()) or public.is_community_moderator());
create policy community_docs_insert on public.community_documents for insert to authenticated
 with check (uploader_id=(select auth.uid()) and review_status='pending' and reviewer_id is null and reviewed_at is null);
create policy community_docs_moderate on public.community_documents for update to authenticated
 using (public.is_community_moderator()) with check (public.is_community_moderator());

drop policy if exists community_files_insert on storage.objects;
drop policy if exists community_files_select on storage.objects;
create policy community_files_insert on storage.objects for insert to authenticated
 with check (bucket_id='community-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy community_files_select on storage.objects for select to anon,authenticated
 using (bucket_id='community-documents' and (
   owner_id=(select auth.uid())::text or exists (
     select 1 from public.community_documents d where d.file_storage_key=name and d.review_status='approved'
   )
 ));
-- Moderators are assigned only through the SQL Editor by a trusted project administrator:
-- insert into public.community_moderators(user_id) values ('ACCOUNT_UUID') on conflict do nothing;
-- Do not put moderator UUIDs or privileged keys in browser code.

drop policy if exists community_files_cleanup on storage.objects;
create policy community_files_cleanup on storage.objects for delete to authenticated
 using (bucket_id='community-documents' and owner_id=(select auth.uid())::text
   and not exists(select 1 from public.community_documents d where d.file_storage_key=name));
