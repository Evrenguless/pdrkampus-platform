-- Apply after 006, 007, and 008 in the NEW platform project.
-- Public profiles expose only a display name and UUID; emails remain private.
create or replace function public.get_member_profiles(member_ids uuid[])
returns table(id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select p.id,p.display_name from public.profiles p where p.id=any(member_ids);
$$;
revoke all on function public.get_member_profiles(uuid[]) from public;
grant execute on function public.get_member_profiles(uuid[]) to anon,authenticated;

grant update(display_name) on public.profiles to authenticated;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using ((select auth.uid())=id) with check ((select auth.uid())=id);

alter table public.community_documents drop constraint if exists community_documents_review_status_check;
alter table public.community_documents add constraint community_documents_review_status_check
check (review_status in ('pending','approved','rejected','archived'));
alter table public.community_documents drop constraint if exists document_review_metadata;
alter table public.community_documents add constraint document_review_metadata
check ((review_status='pending' and reviewer_id is null and reviewed_at is null)
  or (review_status in ('approved','rejected','archived') and reviewer_id is not null and reviewed_at is not null));
grant update(title,document_type,level,topic) on public.community_documents to authenticated;

create table if not exists public.community_document_audit (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.community_documents(id) on delete restrict,
  actor_id uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  before_values jsonb not null,
  after_values jsonb not null
);
alter table public.community_document_audit enable row level security;
revoke all on public.community_document_audit from public,anon,authenticated;
create or replace function public.audit_community_document_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.community_document_audit(document_id,actor_id,before_values,after_values)
  values (new.id, (select auth.uid()),
    jsonb_build_object('title',old.title,'document_type',old.document_type,'level',old.level,'topic',old.topic,'status',old.review_status),
    jsonb_build_object('title',new.title,'document_type',new.document_type,'level',new.level,'topic',new.topic,'status',new.review_status));
  return new;
end;
$$;
revoke all on function public.audit_community_document_change() from public,anon,authenticated;
drop trigger if exists on_community_document_change on public.community_documents;
create trigger on_community_document_change after update on public.community_documents
for each row when ((old.title,old.document_type,old.level,old.topic,old.review_status)
  is distinct from (new.title,new.document_type,new.level,new.topic,new.review_status))
execute function public.audit_community_document_change();
